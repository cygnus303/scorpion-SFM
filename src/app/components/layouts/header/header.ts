import { Component, inject, PLATFORM_ID, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonService } from '../../../shared/services/common.service';
import { HeaderService } from '../../../shared/services/header.service';
import { DashboardService } from '../../../shared/services/dashboard';
import { Router, NavigationEnd } from '@angular/router';
import { filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { DateRangePickerComponent } from '../../../shared/components/date-range-picker/date-range-picker';
import { Subject, Subscription } from 'rxjs';
import { LrView } from '../../lr-view/lr-view';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, BsDatepickerModule, DateRangePickerComponent, LrView],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit, OnDestroy {
  @ViewChild('dateRangePicker') dateRangePickerComponent?: DateRangePickerComponent;
  @ViewChild('lrViewModal') lrViewModal!: LrView;
  private closeTimeout?: any;
  public headerService = inject(HeaderService);
  public commonService = inject(CommonService);
  public dashboardService = inject(DashboardService);
  public headerTitle$ = this.headerService.headerTitle$;
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  public modalService = inject(BsModalService);
  public userInfo: any = null;
  public showDropdown: boolean = false;
  public modalRef?: BsModalRef;
  public searchQuery: string = '';
  public activeQuickFilter: string = 'today';
  public selectedDateRange: Date[] = [new Date(), new Date()];

  public docketNumber: string = '';
  public trackingResult: any = null;
  public errorMessage: string = '';
  public showTrackingModal: boolean = false;
  public isTrackingDocket: boolean = false;

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
      const cleanUrl = url.replace(/^\//, '').split('?')[0];
      this.updateHeaderFromUrl(url);

      if (cleanUrl === 'calendar') {
        this.setFilter('month');
      } else {
        this.commonService.resetFilters();
        this.activeQuickFilter = 'today';
      }
    });

    // Set initial header title based on current route
    this.updateHeaderFromUrl(this.router.url);

    // Initialize search debouncing
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchValue => {
      this.commonService.updateFilters({
        searchText: searchValue,
        Page: 1,
        StartDate: this.commonService.globalFilters.startDate,
        EndDate: this.commonService.globalFilters.endDate
      });
    });
  }

  ngOnInit() {
    // Sync UI with global filters
    this.commonService.filterChanged$.subscribe(filters => {
      if (this.searchQuery !== filters.searchText) {
        this.searchQuery = filters.searchText || '';
      }

      if (filters.filterType) {
        this.activeQuickFilter = filters.filterType;
      }

      // Parse dates if they exist and are strings
      if (filters.startDate && filters.endDate) {
        const [d, m, y] = filters.startDate.split('/').map(Number);
        const [d2, m2, y2] = filters.endDate.split('/').map(Number);
        this.selectedDateRange = [new Date(y, m - 1, d), new Date(y2, m2 - 1, d2)];
        this.checkAndSetActiveFilter(this.selectedDateRange);
      }
    });

    // Check current route and set appropriate filter
    const currentUrl = this.router.url.replace(/^\//, '').split('?')[0];
    if (currentUrl === 'calendar') {
      this.setFilter('month');
    } else {
      this.setFilter('today');
    }
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
    this.commonService.calendarViewSubject.next(type);
  }

  onDateSelected(dates: Date[]) {
    // Check if dates actually changed to prevent double triggers and NG0100
    const prevStart = this.selectedDateRange?.[0]?.toLocaleDateString("en-GB");
    const prevEnd = this.selectedDateRange?.[1]?.toLocaleDateString("en-GB");
    const newStart = dates?.[0]?.toLocaleDateString("en-GB");
    const newEnd = dates?.[1]?.toLocaleDateString("en-GB");

    if (prevStart === newStart && prevEnd === newEnd) {
      return;
    }

    this.selectedDateRange = dates;
    this.checkAndSetActiveFilter(dates);
    this.commonService.updateFilters({
      startDate: newStart || null,
      endDate: newEnd || null,
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
      'csat': 'CSAT',
      'task': 'task',
      'calendar': 'calendar',
      'training': 'training',
      'login': 'Dashboard',
      'meeting-MOM': 'meeting-MOM',
      'payment': 'payment',
      'appointment-delivery': 'appointment-delivery',
      'my-customer': 'my-customer',
    };

    let menuKey = routeToMenuKey[cleanUrl];
    if (!menuKey && cleanUrl.startsWith('csat/')) {
      menuKey = 'CSAT';
    }

    this.headerService.updateHeaderFromMenu(menuKey || 'Dashboard');
  }

  toggleDateRangePicker(event: MouseEvent) {
    if (this.dateRangePickerComponent) {
      this.dateRangePickerComponent.togglePicker(event);
    }
  }

  openDateRangePicker() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = undefined;
    }
    if (this.dateRangePickerComponent) {
      this.dateRangePickerComponent.openPicker();
    }
  }

  closeDateRangePicker() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    this.closeTimeout = setTimeout(() => {
      const isHovered = document.querySelector('app-date-range-picker:hover') ||
                        document.querySelector('.selected-date-info:hover') ||
                        document.querySelector('.bs-datepicker-container:hover') ||
                        document.querySelector('.bs-calendar-container:hover');
      
      if (!isHovered && this.dateRangePickerComponent) {
        this.dateRangePickerComponent.closePicker();
      }
    }, 200);
  }

  openTrackingModal() {
    this.showTrackingModal = true;
    this.docketNumber = '';
    this.trackingResult = null;
    this.errorMessage = '';
  }

  closeTrackingModal() {
    this.trackingResult = null;
    this.showTrackingModal = false;
  }

  openLrView() {
    if (this.lrViewModal) {
      this.lrViewModal.showPopup(this.docketNumber);
    }
  }

  trackDocket() {
    this.errorMessage = '';
    this.trackingResult = null;
    
    if (!this.docketNumber || this.docketNumber.trim() === '') {
      this.errorMessage = 'Please enter a valid docket number';
      return;
    }
    
    this.isTrackingDocket = true;
    this.dashboardService.getTrackingDetail(this.docketNumber).subscribe({
      next: (res: any) => {
        this.isTrackingDocket = false;
        const data = res.data || res.Data || res.result || res;
        
        if (data && data.HeaderMeta && data.HeaderMeta.length > 0) {
          const header = data.HeaderMeta[0];
          const timeline = data.Timeline || [];
          
          this.trackingResult = {
            docket: header.dockno || this.docketNumber.toUpperCase(),
            manualDocket: header.manual_dockno || header.dockno || '-',
            originDest: header.Origin_dest || '-',
            dest: header.destcd || '-',
            cnoteDate: header.dockdt || '-',
            consignor: header.Cnor || '-',
            consignee: header.Cnee || '-',
            currentStatus: header.CurrentStatus || 'In Transit',
            edd: header.EDD || '-',
            add: header.ADDDate || '-',
            serviceType: header.ServiceType || '-',
            transportMode: header.TransportMode || '-',
            paybase: header.Paybase || '-',
            podName: header.PODName || header.podName || '',
            complaintsCount: data.Complaints ? data.Complaints.length : 0,
            prqCount: data.PRQ ? data.PRQ.length : 0,
            history: timeline.map((t: any) => {
              // Extract time from ASDTTime (e.g. "31 May 2026 18:01:19:957" -> "18:01")
              let timeStr = '00:00';
              if (t.ASDTTime && t.ASDTTime.length > 11) {
                const parts = t.ASDTTime.split(' ');
                if (parts.length > 3) {
                  timeStr = parts[3].substring(0, 5); // "18:01"
                }
              }
              return {
                date: t.ASDTDate,
                time: timeStr,
                status: t.ACTIVITY,
                docNo: t.DOCNO || '',
                tripStatus: t.TripStatus || ''
              };
            })
          };
        } else {
          this.errorMessage = 'Docket not found. Please try another number.';
        }
      },
      error: (err) => {
        this.isTrackingDocket = false;
        console.error(err);
        this.errorMessage = 'Failed to fetch tracking details. Please try again.';
      }
    });
  }

  viewPod() {
    if (this.trackingResult && this.trackingResult.podName) {
      const url = `https://sepltms.scorpiongroup.in/Images/FMScanDocument/${this.trackingResult.podName}`;
       const popup = window.open('', 'popupWindow',
      'width=900,height=600,top=100,left=200,resizable=yes,scrollbars=yes'
    );
        if (popup) {
      popup.location.href = url;
    }
    }
  }

  openTrack(dockno: string){
      const url = `https://sfm.scorpiongroup.in/Tracking/LRLifecycleTracker?DocketNo=${dockno}&DockSf=.&src=angular`;
    const popup = window.open('', 'popupWindow',
      'width=900,height=600,top=100,left=200,resizable=yes,scrollbars=yes'
    );

    if (popup) {
      popup.location.href = url;
    }
  }
}
