import { Component, inject, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ComplaintResponse } from '../../shared/models/complaint.model';
import { CommonService } from '../../shared/services/common.service';
import { ExportService } from '../../shared/services/export.service';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ComplaintService } from '../../shared/services/complaint.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ComplaintDetail } from './complaint-detail/complaint-detail';
import { AddTicket } from './add-ticket/add-ticket';
import { PrqService } from '../../shared/services/prq-service';
import { PickupRequestList } from '../pickup-request-list/pickup-request-list';
import { IdentityService } from '../../shared/services/identity.service';
import { EnquiryList } from './enquiry-list/enquiry-list';

@Component({
  selector: 'app-complaint-list',
  imports: [CommonModule, FormsModule, PopoverModule, PaginationModule, NgSelectModule, ComplaintDetail, AddTicket, PickupRequestList, EnquiryList],
  templateUrl: './complaint-list.html',
  styleUrl: './complaint-list.scss',
})
export class ComplaintList {
  public complaints: ComplaintResponse[] = [];
  public totalItems: number = 0;
  public PRQCard: any[] = [];
  public isExportLoading: boolean = false;
  public isLoading: boolean = false;
  public compliantCard: any;
  public activeTab: string = 'complaint';

  public statusList: any[] = [
    { id: '', name: 'All' },
    { id: 'New', name: 'New' },
    { id: 'Closed', name: 'Closed' },
    { id: 'Escalated', name: 'Escalated' },
    { id: 'Updated', name: 'Updated' }
  ];
  public selectedStatus: string = '';
  @ViewChild('ComplaintDetail') ComplaintDetail!: ComplaintDetail;
  @ViewChild('AddTicket') AddTicket!: AddTicket;

  private sweetAlertService = inject(SweetAlertService);
  public complaintService = inject(ComplaintService);
  public commonService = inject(CommonService); // Public to access globalFilters in HTML
  private exportService = inject(ExportService);
  private PRQService = inject(PrqService);
  private identityService = inject(IdentityService);
  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getComplaintList();
      this.getPRQCardList()
      this.getCompliantCard();
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPRQCardList() {
    const payload = {
      "fromDate": this.formatDate(this.commonService.globalFilters.startDate),
      "toDate": this.formatDate(this.commonService.globalFilters.endDate),
      "updateBy": this.commonService.globalFilters.UserID.toString(),
      "location": this.identityService.getBranchCode(),
      "type": "N"
    }
    this.PRQService.getPRQCard(payload).subscribe({
      next: (response: any) => {
        this.PRQCard = response.data.sort((a: any, b: any) => a.ord - b.ord);
      }
    });
  }

  getIconEmoji(icon: string): string {
    const iconMap: { [key: string]: string } = {
      'group': '👥',
      'thumbs-up': '👍',
      'pencil': '✏️',
      'adjust': '🚚',
      'ban': '🚫'
    };
    return iconMap[icon] || '📌';
  }

  formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(+year, +month - 1, +day);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(',', '').toLowerCase();
  };

  getCardColor(color: string): string {
    switch (color) {
      case 'Newblue':
        return 'red';

      case 'Newblue1':
        return '#f59e0b';

      case 'Newblue3':
        return '#dc2626';

      case 'Newblue4':
        return '#2563eb';

      case 'Newblue6':
        return '#6b7280';

      default:
        return '#ccc';
    }
  }


  getComplaintList(page: number = this.commonService.globalFilters.Page) {
    this.commonService.globalFilters.Page = page;
    const data = {
      Page: this.commonService.globalFilters.Page.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      SearchFilter: this.commonService.globalFilters.searchText,
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate,
      userId: this.commonService.globalFilters.UserID.toString(),
      export: false,
      complaintStatus: this.selectedStatus
    }
    this.isLoading = true;
    this.complaintService.getComplaintList(data).subscribe({
      next: (response: any) => {
        if (response) {
          this.complaints = response.data;
          this.totalItems = Number(response.totalCount) || 0;
        }
        this.isLoading = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response?.error?.Error?.Message);
        this.isLoading = false;
      },
    });
  }

  openAddTicketModal(type: string, id?: string) {
    if (id) {
      // For Edit/Close/Escalation - set complaint type and fetch data
      this.AddTicket.complaint = type; // Default to Update, can be changed based on button context
      this.AddTicket.showPopupAddTicket(() => {
        return this.complaintService.getComplaintDetails(id, this.commonService.globalFilters.UserID.toString());
      });
    } else {
      // For New Ticket - set as Add mode with no API call
      this.AddTicket.complaint = type;
      this.AddTicket.showPopupAddTicket();
    }
  }

  viewModal(id: any) {
    this.ComplaintDetail.showPopupWithLoading(() => {
      return this.complaintService.getComplaintDetails(id, this.commonService.globalFilters.UserID.toString());
    });
  }

  exportComplaints() {
    const startDate = this.commonService.globalFilters.startDate;
    const endDate = this.commonService.globalFilters.endDate;
    const filters: any = {
      complaintStatus: this.selectedStatus
    };
    this.isExportLoading = true;
    this.complaintService.getComplaintListexport(this.commonService.globalFilters.UserID.toString(), startDate, endDate, filters).subscribe({
      next: (response) => {
        if (response) {
          this.exportService.exportToExcel(response.data);
        }
        this.isExportLoading = false;
      }
    });
  }

  onDataEmitter() {
    this.getComplaintList();
    this.getCompliantCard();
  }

  formatToGMT = (dateStr: string, isEndDate = false): string => {
    if (!dateStr) return '';
    let date: Date;
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      // ✅ UTC ma directly banavo
      date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateStr);
      return '';
    }
    if (isEndDate) {
      date.setUTCHours(23, 59, 59, 0);
    } else {
      date.setUTCHours(0, 0, 0, 0);
    }
    return date.toUTCString();
  };

  getCompliantCard() {
    const params = {
      startDate: this.formatToGMT(this.commonService.globalFilters.startDate),
      endDate: this.formatToGMT(this.commonService.globalFilters.endDate),
      userId: this.commonService.globalFilters.UserID.toString(),
    }

    this.complaintService.getCompalintCounteData(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.compliantCard = response.data[0];
        }
        this.isExportLoading = false;
      }
    });
  }
}
