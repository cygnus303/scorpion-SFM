import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderService } from '../../shared/services/header.service';
import { CallService } from '../../shared/services/call.service';
import { CommonService } from '../../shared/services/common.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { CallResponse } from '../../shared/models/call.model';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { FormsModule } from '@angular/forms';
import { AddCall } from './add-call/add-call';
import { CallDetail } from './call-detail/call-detail';
import { ExportService } from '../../shared/services/export.service';

@Component({
  selector: 'app-call-list',
  standalone: true,
  imports: [CommonModule,PopoverModule,PaginationModule,FormsModule,AddCall,CallDetail],
  templateUrl: './call-list.html',
  styleUrl: './call-list.scss'
})
export class CallList implements OnInit {
  public calls: CallResponse[] = [];
  public selectedUser: any = null;
  public totalItems: number = 0;
  public loading:boolean=false;
  public isExportLoading:boolean=false;
  public selectedDateFilter: string = 'today'; // Default to today
  @ViewChild('addCallComponent') addCallComponent!: AddCall;
  @ViewChild('callDetailComponent') callDetailComponent!: AddCall;

  private headerService = inject(HeaderService);

  constructor(
    public callService:CallService,
    public commonService:CommonService,
    private sweetAlertService:SweetAlertService,
     public exportService: ExportService,
  ) { }

  ngOnInit(): void {
    this.headerService.updateHeader('Call');
    this.getCalls()
  }

  filterByDateRange(range: string) {
    this.selectedDateFilter = range;
    this.commonService.globalFilters.Page = 1; // Reset to first page
    this.getCalls();
  }

  getDateRangeParams(): any {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (this.selectedDateFilter) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(today.getFullYear(), today.getMonth(), diff);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        break;
      default:
        return {};
    }

    return {
      StartDate: this.formatDate(startDate),
      EndDate: this.formatDate(endDate)
    };
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

    getCalls(page: number = 1) {
    this.commonService.updateLoader(true);
    const dateParams = this.getDateRangeParams();
    const params: any = {
      Page: this.commonService.globalFilters.Page.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      UserID: this.commonService.globalFilters.UserID.toString(),
      ...dateParams
    };
    this.loading = true;
    this.callService.getCallList(params).subscribe({
      next: (response) => {
        if (response) {
          this.calls = response.data;
          this.totalItems = response.totalCount;
        }
        this.loading = false;
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.loading = false;
        this.commonService.updateLoader(false);
      },
    });
  }

    onPageChange(event: any): void {
    this.getCalls(event.page);
  }

  openCallModal(data?:any){
    this.addCallComponent.showPopup(data);
  }

   viewModal(data: any) {
    this.callDetailComponent.showPopup(() => {
      return this.callService.getCallDetails(data.callId, this.commonService.globalFilters.UserID.toString());
    });
  }

    exportCalls() {
    const filters: any = {
      UserID:this.commonService.globalFilters.UserID.toString(),
    };
    this.isExportLoading = true;
    this.callService.exportCall(filters).subscribe({
      next: (response) => {
        if (response) {
          this.exportService.exportToExcel(response.data);
        }
        this.isExportLoading = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.isExportLoading = false;
      },
    });
  }

}
