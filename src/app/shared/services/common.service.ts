import { inject, Injectable, signal } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Observable, Subject } from 'rxjs';
import { IdentityService } from './identity.service';
import { ExternalService } from './external.service';
import { UserResponse } from '../models/meeting.model';
import { IApiBaseResponse } from '../interfaces/api-base-action-response';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private loading: boolean = false;
  public users: UserResponse[] = [];
  public isSidebarCollapsed = signal(false);
  public calendarViewSubject = new Subject<string>();
  private externalService = inject(ExternalService);
  // Global Filter State
  public globalFilters: any = {
    Page: 1,
    PageSize: 10,
    UserID: '',
    startDate: '',
    endDate: '',
    searchText: ''
  };

  private filterSubject = new BehaviorSubject<any>(this.globalFilters);
  public filterChanged$ = this.filterSubject.asObservable().pipe(
    debounceTime(200),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );

  constructor(
    private apiHandlerService: ApiHandlerService,
    private identityService: IdentityService
  ) {
    // Initialize default values
    this.updateUserId();
    const now = new Date();
    this.globalFilters.startDate = new Date(now.setHours(0, 0, 0, 0)).toLocaleDateString("en-GB");
    this.globalFilters.endDate = new Date(now.setHours(23, 59, 59, 999)).toLocaleDateString("en-GB");
    console.log(this.globalFilters)

    if (typeof window !== 'undefined') {
      // Set initial state
      this.adjustSidebarState(window.innerWidth);

      // Listen to resize
      window.addEventListener('resize', () => {
        this.adjustSidebarState(window.innerWidth);
      });
    }
  }

  private adjustSidebarState(width: number): void {
    if (width <= 1024) {
      // Mobile: hidden by default
      this.isSidebarCollapsed.set(true);
    } else if (width <= 1200) {
      // Intermediate screen (e.g. 1188px): show as mini sidebar (60px)
      this.isSidebarCollapsed.set(true);
    } else {
      // Large screen (> 1200px): show expanded sidebar
      this.isSidebarCollapsed.set(false);
    }
  }

  updateUserId(): void {
    const userId = this.identityService.getLoggedUserId();
    if (userId) {
      this.globalFilters.UserID = userId;
      this.filterSubject.next(this.globalFilters);
    }
  }

  updateFilters(newFilters: any): void {
    this.globalFilters = { ...this.globalFilters, ...newFilters };
    this.filterSubject.next(this.globalFilters);
  }

  emitFilter(filter: any): void {
    this.filterSubject.next(filter);
  }

  resetFilters(type: string = 'today', start: Date = new Date(), end: Date = new Date()): void {
    this.globalFilters = {
      ...this.globalFilters,
      Page: 1,
      startDate: start.toLocaleDateString("en-GB"),
      endDate: end.toLocaleDateString("en-GB"),
      searchText: '',
      filterType: type
    };
    this.filterSubject.next(this.globalFilters);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }

  updateLoader(status: boolean): void {
    this.loading = status;
    // You can emit this status through a subject if needed for UI components
  }

  getMenu(): Observable<IApiBaseResponse<any>> {
    return this.apiHandlerService.Get(`External/Menu?userid=${this.identityService.getLoggedUserId()}`);
  }

  isLoading(): boolean {
    return this.loading;
  }

  getUsers() {
    const userId = this.identityService.getLoggedUserId();
    if (!userId) return; // Prevent empty userId calls

    this.externalService.getUserData(userId).subscribe({
      next: (response) => {
        if (response) {
          this.users = response.data.map((user: any) => ({
            userId: user.userId,
            name: `${user.userId} : ${user.name}`,
          }));
        }
      }
    });
  }

  convertToDisplayDate(dateStr: string): string {
    if (!dateStr) return '--';

    const [day, month, year] = dateStr.split('/');
    const date = new Date(+year, +month - 1, +day);

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  isDateDisabled = (date: { year: number; month: number; day: number }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    const selectedDate = new Date(date.year, date.month - 1, date.day);
    selectedDate.setHours(0, 0, 0, 0); // Normalize selected date

    return selectedDate < today; // Disable only past dates, allow today
  };
}
