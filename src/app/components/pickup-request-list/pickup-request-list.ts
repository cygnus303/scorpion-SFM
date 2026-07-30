import { Component, inject, ViewChild, TemplateRef, viewChild } from '@angular/core';
import { saveAs } from 'file-saver';
import { CommonModule } from '@angular/common';
import { AddPrq } from './add-prq/add-prq';
import { PrqService } from '../../shared/services/prq-service';
import { CommonService } from '../../shared/services/common.service';
import { Subject, takeUntil } from 'rxjs';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { FormsModule } from '@angular/forms';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { IdentityService } from '../../shared/services/identity.service';
import { PrqDetail } from './prq-detail/prq-detail';
import { AddPrqPopup } from './add-prq-popup/add-prq-popup';
import { ExpenseGeneralService } from '../../shared/services/expense-general.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import * as XLSX from 'xlsx';
import { PrqView } from './prq-view/prq-view';

@Component({
  selector: 'app-pickup-request-list',
  imports: [CommonModule, AddPrq, PaginationModule, FormsModule, PrqDetail,AddPrqPopup,PrqView],
  templateUrl: './pickup-request-list.html',
  styleUrl: './pickup-request-list.scss',
})
export class PickupRequestList {
  public PRQCard: any[] = [];
  public PRQList: any[] = [];
  public totalItems: number = 0;
  public isShaking: boolean = false;
  private destroy$ = new Subject<void>();
  @ViewChild('addPRQ') addPRQ!: AddPrq;
  @ViewChild('addPrqPopup') addPrqPopup!: AddPrqPopup;
  @ViewChild('PrqDetail') PrqDetail!: PrqDetail;
  @ViewChild('PrqView') PrqView!: PrqView;
  public isExportLoading: boolean = false;
  public isLoading: boolean = false;
  
  // Cancel Modal properties
  public cancelModalRef?: BsModalRef;
  public cancelPrqNo: string = '';
  public cancelReason: string = '';
  public isCancelSubmitted: boolean = false;
  @ViewChild('cancelPrqModal') cancelPrqModalTemplate!: TemplateRef<any>;

  private sweetAlertService = inject(SweetAlertService);
  private identityService = inject(IdentityService);
  private modalService = inject(BsModalService);
  
  constructor(
    private PRQService: PrqService,
    public commonService: CommonService,
    public expenseGeneralService:ExpenseGeneralService
  ) { }

  ngOnInit() {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // this.getPRQCardList();
      this.getPRQList()
    });

  }

  selectPrqType(prqNo?:string) {
    // this.addPRQ.showPopup();
    this.addPrqPopup.showPopup(prqNo);
  }

  openPRQDetailModal(PRQNo?: any) {
    this.PrqView.showPopup(PRQNo);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  getPRQList(page: number = this.commonService.globalFilters.Page) {
    this.isLoading = true;
    this.commonService.globalFilters.Page = page;
    const payload = {
       "FilterJson": {
      ReportId:'222',
      FromDate: this.formatDate(this.commonService.globalFilters.startDate),
      ToDate: this.formatDate(this.commonService.globalFilters.endDate),
      BaseLocation: this.identityService.getBranchCode(),
      UserName:this.identityService.getUserName(),
      Status:"All",
      PageNo:this.commonService.globalFilters.Page.toString(),
      PageSize:this.commonService.globalFilters.PageSize.toString(),
      IsDownload:"0"
       }
    }
    this.expenseGeneralService.getDynamicData(payload).subscribe((response: any) => {
      this.isLoading = false;
      this.PRQList = response.Table2;
      this.totalItems = response.Table1[0].TotalRecords;
    });
  }

  onPageChange(event: any) {
    this.getPRQList(event.page)
  }

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

  //   onPageChange(event: any): void {
  //   this.getPRQList(event.page);
  // }

  onDataEmitter() {
    // this.getPRQCardList();
    this.getPRQList();
  }

  downloadPRQ() {
    const payload = {
       "FilterJson": {
      ReportId:'222',
      FromDate: this.formatDate(this.commonService.globalFilters.startDate),
      ToDate: this.formatDate(this.commonService.globalFilters.endDate),
      BaseLocation: this.identityService.getBranchCode(),
      UserName:this.identityService.getUserName(),
      Status:"",
      PageNo:this.commonService.globalFilters.Page.toString(),
      PageSize:this.commonService.globalFilters.PageSize.toString(),
      IsDownload:"1"
       }
    }
    this.isExportLoading = true;
    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        if (response && response.Table2 && response.Table2.length > 0) {
          const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(response.Table2);
          const workbook: XLSX.WorkBook = {
            Sheets: { 'PRQ Report': worksheet },
            SheetNames: ['PRQ Report'],
          };
          
          const excelBuffer: any = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
            cellStyles: false,
          });

          const blob: Blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          
          saveAs(blob, `PRQ_Report_${new Date().getTime()}.xlsx`);
        } else {
          this.sweetAlertService.error('No data available to download');
        }
        this.isExportLoading = false;
      },
      error: (error: any) => {
        this.sweetAlertService.error(error?.error?.message || 'Download failed');
        this.isExportLoading = false;
      },
    });
  }

  onCancel(prqNo: string) {
    this.cancelPrqNo = prqNo;
    this.cancelReason = '';
    this.isCancelSubmitted = false;
    this.cancelModalRef = this.modalService.show(this.cancelPrqModalTemplate, { class: 'modal-dialog-centered cancel-prq-modal', backdrop: 'static' });
  }

  closeCancelModal() {
    this.cancelModalRef?.hide();
    this.cancelPrqNo = '';
    this.cancelReason = '';
    this.isCancelSubmitted = false;
  }

  confirmCancel() {
    this.isCancelSubmitted = true;
    if (!this.cancelReason || !this.cancelReason.trim()) {
      this.isShaking = false;
      setTimeout(() => this.isShaking = true, 10);
      setTimeout(() => this.isShaking = false, 400);
      return;
    }

    const payload = {
      "FilterJson": {
        "ReportId": "221",
        "PRQNo": this.cancelPrqNo,
        "UserName": this.identityService.getUserName(),
        "CancelReason": this.cancelReason.trim()
      }
    };
    
    this.isLoading = true;
    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.sweetAlertService.success("PRQ Cancelled Successfully");
        this.closeCancelModal();
        this.getPRQList();
      },
      error: (response: any) => {
        this.isLoading = false;
        this.sweetAlertService.error(response?.error?.message || "Failed to cancel PRQ");
      }
    });
  }

}
