import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { Subject, takeUntil, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AddAppointment } from './add-appointment/add-appointment';
import { ViewAppointment } from './view-appointment/view-appointment';
import { RescheduleAppointment } from './reschedule-appointment/reschedule-appointment';
import { UpdateAppointment } from './update-appointment/update-appointment';
import { AppointmentDeliveryService } from '../../shared/services/appointment-delivery.service';
import { CommonService } from '../../shared/services/common.service';
import { ExportService } from '../../shared/services/export.service';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { FormsModule } from '@angular/forms';
import { CountUpDirective } from '../../shared/directives/count-up.directive';



@Component({
  selector: 'app-appointment-delivery',
  standalone: true,
  imports: [CommonModule, AddAppointment, ViewAppointment, RescheduleAppointment, UpdateAppointment, PaginationModule, FormsModule, CountUpDirective],
  templateUrl: './appointment-delivery.html',
  styleUrl: './appointment-delivery.scss',
})
export class AppointmentDelivery implements OnInit, OnDestroy {
  public activeTab: 'APMT' | 'CSD' | 'MSD' = 'APMT';
  public appointments: any[] = [];
  public summaryCounts: any = {};
  public totalItems: number = 0;
  public isLoading: boolean = false;
  public isCardsLoading: boolean = true;
  public isExportLoading: boolean = false;

  private appointmentDeliveryService = inject(AppointmentDeliveryService);
  public commonService = inject(CommonService);
  private exportService = inject(ExportService);

  private destroy$ = new Subject<void>();
  private appointmentSubscription?: Subscription;

  @ViewChild('addAppointmentModal') addAppointmentModal!: AddAppointment;
  @ViewChild('viewAppointmentModal') viewAppointmentModal!: ViewAppointment;
  @ViewChild('rescheduleModal') rescheduleModal!: RescheduleAppointment;
  @ViewChild('updateModal') updateModal!: UpdateAppointment;
  
  formatListDate(d: string): string {
    if (!d || !d.includes('-')) return d || '-';
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.substring(0, 2)} ${m[+d.substring(3, 5) - 1]} ${d.substring(6, 10)}`;
  }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.fetchData();
    });
  }

  setTab(tab: 'APMT' | 'CSD' | 'MSD') {
    this.activeTab = tab;
    this.fetchData();
  }

  ngOnDestroy(): void {
    if (this.appointmentSubscription) { this.appointmentSubscription.unsubscribe(); }
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatToISODate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const date = new Date(Date.UTC(+parts[2], +parts[1] - 1, +parts[0]));
      return date.toISOString();
    }
    return new Date(dateStr).toISOString();
  }

  fetchData(page: number = this.commonService.globalFilters.Page) {
    if (this.appointmentSubscription) {
      this.appointmentSubscription.unsubscribe();
    }
    
    this.commonService.globalFilters.Page = page;
    const payload = {
      type: this.activeTab,
      formDate: this.formatToISODate(this.commonService.globalFilters.startDate),
      toDate: this.formatToISODate(this.commonService.globalFilters.endDate),
      searchText: this.commonService.globalFilters.searchText,
      userId: this.commonService.globalFilters.UserID.toString(),
      pageno: this.commonService.globalFilters.Page,
      pageSize: this.commonService.globalFilters.PageSize
    };

    this.isLoading = true;
    this.isCardsLoading = true;

    this.appointmentSubscription = this.appointmentDeliveryService.getDeliveryAppointmentData(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isCardsLoading = false;
        if (response && response.success && response.data) {
          if (response.data.summary) {
            this.summaryCounts = response.data.summary;
          }
          if (response.data.pagination) {
            this.totalItems = response.data.pagination.totalRecords || 0;
          }
          if (response.data.data && Array.isArray(response.data.data)) {
            this.appointments = response.data.data || [];
          } else {
            this.appointments = [];
          }
        } else {
          this.appointments = [];
          this.totalItems = 0;
          if (response && Array.isArray(response.data)) {
            this.appointments = response.data;
          }
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isCardsLoading = false;
        this.appointments = [];
        this.totalItems = 0;
        this.summaryCounts = {};
        console.error('Error fetching delivery appointment data:', err);
      }
    });
  }

  exportToExcel() {
    const payload = {
      type: this.activeTab,
      formDate: this.formatToISODate(this.commonService.globalFilters.startDate),
      toDate: this.formatToISODate(this.commonService.globalFilters.endDate),
      searchText: this.commonService.globalFilters.searchText,
      userId: this.commonService.globalFilters.UserID.toString(),
      pageno: this.commonService.globalFilters.Page,
      pageSize: this.commonService.globalFilters.PageSize
    };

    this.isExportLoading = true;
    this.appointmentDeliveryService.getDeliveryAppointmentDataExcel(payload).subscribe({
      next: (response: any) => {
        this.isExportLoading = false;
        if (response && response.success && response.data) {
          this.exportService.exportToExcel(response.data);
        }
      },
      error: (err: any) => {
        this.isExportLoading = false;
        console.error('Error exporting delivery appointment data:', err);
      }
    });
  }

  openAddModal() {
    this.addAppointmentModal.openModal(this.activeTab);
  }

  openViewModal(data: any) {
    this.viewAppointmentModal.openModal(this.activeTab, data);
  }

  openRescheduleModal(data: any) {
    this.rescheduleModal.openModal(this.activeTab, data);
  }

  openUpdateModal(data: any) {
    this.updateModal.openModal(this.activeTab, data);
  }

  formatDate(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ');
    return parts[0] || '';
  }

  formatTime(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ');
    if (parts.length >= 2) {
      return parts.slice(1).join(' ').replace(/\s*[–—-]\s*/g, ' — ');
    }
    return '';
  }

  splitOrgDest(orgDest: string): { org: string; dest: string } {
    if (!orgDest) return { org: '', dest: '' };
    const parts = orgDest.split(/\s*→\s*|\s*->\s*/);
    return {
      org: parts[0] || orgDest,
      dest: parts[1] || ''
    };
  }
}
