import { inject, Injectable, signal } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { Observable, Subject } from 'rxjs';
import { IdentityService } from './identity.service';
import { ExternalService } from './external.service';
import { UserResponse } from '../models/meeting.model';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private loading: boolean = false;
  public users: UserResponse[] = [];
  public isSidebarCollapsed = signal(false);
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

  private filterSubject = new Subject<any>();
  public filterChanged$ = this.filterSubject.asObservable();

  constructor(
    private apiHandlerService: ApiHandlerService,
    private identityService: IdentityService
  ) {
    // Initialize default values
    this.globalFilters.UserID = this.identityService.getLoggedUserId();
    const now = new Date();
    this.globalFilters.startDate = new Date(now.setHours(0, 0, 0, 0)).toLocaleDateString("en-GB");
    this.globalFilters.endDate = new Date(now.setHours(23, 59, 59, 999)).toLocaleDateString("en-GB");
  }

  updateFilters(newFilters: any): void {
    this.globalFilters = { ...this.globalFilters, ...newFilters };
    this.filterSubject.next(this.globalFilters);
  }

  emitFilter(filter: any): void {
    this.filterSubject.next(filter);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }

  updateLoader(status: boolean): void {
    this.loading = status;
    // You can emit this status through a subject if needed for UI components
  }

  getMenu(): Observable<any> {
    return this.apiHandlerService.Get('menu');
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
}
