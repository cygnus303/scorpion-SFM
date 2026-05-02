import { Component, inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonService } from '../../../shared/services/common.service';
import { HeaderService } from '../../../shared/services/header.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { DateRangePickerComponent } from '../../../shared/components/date-range-picker/date-range-picker';
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, BsDatepickerModule, DateRangePickerComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit, OnDestroy {
  public headerService = inject(HeaderService);
  public headerTitle$ = this.headerService.headerTitle$;
  public commonService = inject(CommonService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  public modalService = inject(BsModalService);
  public userInfo: any = null;
  public showDropdown: boolean = false;
  public modalRef?: BsModalRef;
  public searchQuery: string = '';
  public activeQuickFilter: string = 'today';
  public selectedDateRange: Date[] = [new Date(), new Date()];

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor() {
    // Get user info from localStorage only if in browser
    if (isPlatformBrowser(this.platformId)) {
      this.getUserInfo();
    }

    // Listen to route changes to update header title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.updateHeaderFromUrl(url);
    });

    // Set initial header title based on current route
    this.updateHeaderFromUrl(this.router.url);

    // Initialize search debouncing
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchValue => {
      this.commonService.updateFilters({ searchText: searchValue, Page: 1 });
    });
  }

  ngOnInit() {
    // Initialize with today's filter to sync UI and Service
    this.setFilter('today');
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  toggleSidebar() {
    this.commonService.toggleSidebar();
  }

  isSidebarCollapsed() {
    return this.commonService.isSidebarCollapsed();
  }

  logout() {
    this.closeDropdown();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('loginUser');
      localStorage.removeItem('token');
    }
    this.router.navigateByUrl('/login');
  }

  getUserInfo() {
    const loginUser = localStorage.getItem('loginUser');
    if (loginUser) {
      try {
        this.userInfo = JSON.parse(loginUser);
      } catch (e) {
        this.userInfo = null;
      }
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown() {
    this.showDropdown = false;
  }

  setFilter(type: string) {
    this.activeQuickFilter = type;
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
    } else if (type === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date();
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
    }

    this.selectedDateRange = [start, end];
    this.commonService.updateFilters({
      startDate: start.toLocaleDateString("en-GB"),
      endDate: end.toLocaleDateString("en-GB"),
      Page: 1
    });
  }

  onDateSelected(dates: Date[]) {
    this.selectedDateRange = dates;
    this.checkAndSetActiveFilter(dates);
    this.commonService.updateFilters({
      startDate: dates?.[0]?.toLocaleDateString("en-GB") || null,
      endDate: dates?.[1]?.toLocaleDateString("en-GB") || null,
      Page: 1
    });
  }

  private checkAndSetActiveFilter(dates: Date[]) {
    if (!dates || dates.length !== 2) {
      this.activeQuickFilter = 'custom';
      return;
    }

    const start = dates[0].toLocaleDateString("en-GB");
    const end = dates[1].toLocaleDateString("en-GB");
    const now = new Date();

    // Check Today
    const todayStr = now.toLocaleDateString("en-GB");
    if (start === todayStr && end === todayStr) {
      this.activeQuickFilter = 'today';
      return;
    }

    // Check Week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff)).toLocaleDateString("en-GB");
    const weekEnd = new Date().toLocaleDateString("en-GB");
    if (start === weekStart && end === weekEnd) {
      this.activeQuickFilter = 'week';
      return;
    }

    // Check Month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString("en-GB");
    const monthEnd = new Date().toLocaleDateString("en-GB");
    if (start === monthStart && end === monthEnd) {
      this.activeQuickFilter = 'month';
      return;
    }

    this.activeQuickFilter = 'custom';
  }

  onSearch() {
    this.searchSubject.next(this.searchQuery);
  }

  private updateHeaderFromUrl(url: string) {
    // Remove leading slash and query params
    const cleanUrl = url.replace(/^\//, '').split('?')[0];

    // Map routes to menu keys
    const routeToMenuKey: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'customer': 'customer',
      'lead': 'Lead',
      'meeting': 'Meeting',
      'call': 'call',
      'quotation': 'quotation',
      'pickup-request': 'pickup-request',
      'expense': 'expense',
      'general-master': 'expense-master',
      'expense-approval': 'expense-approval',
      'sales-dashboard': 'sales-dashboard',
      'collection-dashboard': 'collection-dashboard',
      'cs-dashboard': 'cs-dashboard',
      'complaint': 'complaint',
      'task': 'task',
      'calendar': 'calendar',
      'training': 'training',
      'login': 'Dashboard'
    };

    const menuKey = routeToMenuKey[cleanUrl] || 'Dashboard';
    this.headerService.updateHeaderFromMenu(menuKey);
  }
}
