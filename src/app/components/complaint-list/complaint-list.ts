import { Component, inject, ViewChild } from '@angular/core';
import { Subject, takeUntil, Subscription } from 'rxjs';
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
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { ExpenseGeneralService } from '../../shared/services/expense-general.service';
import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-complaint-list',
  imports: [CommonModule, FormsModule, PopoverModule, PaginationModule, NgSelectModule, ComplaintDetail, AddTicket, PickupRequestList, EnquiryList, CountUpDirective],
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
  public isCardsLoading: boolean = true;
  public activeTab: string = 'complaint';
  public selectedTab: number = 0;
  selectedFile: File | null = null;


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
  @ViewChild(EnquiryList) enquiryListComp!: EnquiryList;

  private sweetAlertService = inject(SweetAlertService);
  public complaintService = inject(ComplaintService);
  public commonService = inject(CommonService); // Public to access globalFilters in HTML
  private exportService = inject(ExportService);
  private PRQService = inject(PrqService);
  private identityService = inject(IdentityService);
  private destroy$ = new Subject<void>();
  private expenseGeneralService = inject(ExpenseGeneralService);
  private complaintSubscription?: Subscription;

  constructor() { }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isCardsLoading = true;
      this.getComplaintList();
      this.getPRQCardList()
      this.getCompliantCard();
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {
    if (this.complaintSubscription) { this.complaintSubscription.unsubscribe(); }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
    getPRQCardList() {
    const payload = {
      "FilterJson": {
        "ReportId": "224",
        "FromDate": this.formatDate(this.commonService.globalFilters.startDate),
        "ToDate": this.formatDate(this.commonService.globalFilters.endDate),
        "BaseLocation":this.identityService.getBranchCode(),
        "UserName": this.identityService.getUserName(),
        "SearchText":this.commonService.globalFilters.searchText || "",
      }
    };
    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        if (response && response.Table1 && response.Table1.length > 0) {
          const data = response.Table1;
          this.PRQCard = data.sort((a: any, b: any) => a.ord - b.ord);
         }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
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
        return '#f50bc2ff';

      case 'Newblue1':
        return '#f59e0b';

      case 'Newblue3':
        return '#096411ff';

      case 'Newblue4':
        return '#2563eb';

      case 'Newblue6':
        return '#dc2626';

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
      complaintStatus: this.selectedStatus,
      AssignFilter: this.selectedTab
    }
    if (this.complaintSubscription) { this.complaintSubscription.unsubscribe(); }
    this.isLoading = true;
    this.complaintSubscription = this.complaintService.getComplaintList(data).subscribe({
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
    if (this.activeTab === 'enquiry' && this.enquiryListComp) {
      this.enquiryListComp.getEnquiryList();
    } else {
      this.getComplaintList();
    }
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
        this.isCardsLoading = false;
        this.isExportLoading = false;
      },
      error: () => {
        this.isCardsLoading = false;
      }
    });
  }

    downloadSampleImport(event: any) {
    event.preventDefault();
    this.complaintService.downloadSampleComplaint(this.commonService.globalFilters.UserID.toString()).subscribe({
      next: (response: Blob) => {
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'ComplaintImport.xlsx';
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.commonService.updateLoader(false);
      },
    });
  }

    triggerFileInput(event: Event, disappointed: void) {
    event.preventDefault();
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  onFileChange(event: any) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];


    if (file) {
      const validExcelTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'application/vnd.ms-excel', // XLS
        'text/csv', // CSV
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // XLSB
        'application/vnd.ms-excel.sheet.macroEnabled.12', // XLSM
        'application/vnd.openxmlformats-officedocument.spreadsheetml.template', // XLTX
        'application/vnd.ms-excel.template.macroEnabled.12', // XLTM
      ];
      if (validExcelTypes.includes(file.type)) {
        this.selectedFile = file;
        const formData = new FormData();
        formData.append('file', file);
        this.importComplaints(formData);
      } else {
        this.sweetAlertService.error(
          'Please upload a valid excel file (XLSX, XLS, or CSV).'
        );
        this.selectedFile = null;
      }
      fileInput.value = '';
    }
  }
  importComplaints(dataToSubmit: any): void {
  this.commonService.updateLoader(true);
  const params = {
    userID: this.commonService.globalFilters.UserID.toString(),
    FlagType: 'I'
  }

  this.complaintService.importComplaint(params, dataToSubmit)
    .subscribe({
      next: (response) => {
        this.commonService.updateLoader(false);

        if (response.success) {
          const statusObj = response.data.find((item: any) => item.type === 'Status');
          const errorRecordObj = response.data.find((item: any) => item.type === 'ErrorRecords');
          if (statusObj?.data?.Message) {
            this.sweetAlertService.success(statusObj.data.Message);
          }
          if (errorRecordObj?.errorRecords?.length) {

            this.downloadInvalidComplaintExcel(errorRecordObj.errorRecords);
          }

          this.getComplaintList();
        } else {
          this.sweetAlertService.error(response.error?.message || 'Import failed.');
        }
      },
      error: (error: any) => {
        this.sweetAlertService.error(error.message || 'An error occurred during import.');
        this.commonService.updateLoader(false);
      },
    });
}

 downloadInvalidComplaintExcel(invalidLeads: any[]): void {
  const cleanedData = invalidLeads.map(({ IsValid, ComStatus, ...rest }) => rest);
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(cleanedData);
  worksheet['!cols'] = Object.keys(cleanedData[0]).map(() => ({ wch: 20 }));
  const workbook: XLSX.WorkBook = {
    Sheets: { 'Invalid Complaints': worksheet },
    SheetNames: ['Invalid Complaints'],
  };

  const excelBuffer: any = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: false,
  });

  const blob: Blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  FileSaver.saveAs(blob, `Invalid_Complaints_${new Date().toISOString().slice(0, 10)}.xlsx`);
} 
}
