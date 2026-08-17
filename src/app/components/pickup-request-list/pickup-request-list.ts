import { Component, EventEmitter, inject, Output, ViewChild, TemplateRef, viewChild } from '@angular/core';
import { saveAs } from 'file-saver';
import { CommonModule, DatePipe } from '@angular/common';
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
import { PopoverModule } from 'ngx-bootstrap/popover';
import * as XLSX from 'xlsx';
import { PrqView } from './prq-view/prq-view';

@Component({
  selector: 'app-pickup-request-list',
  imports: [CommonModule, AddPrq, PaginationModule, FormsModule, PrqDetail,AddPrqPopup,PrqView, PopoverModule],
  templateUrl: './pickup-request-list.html',
  styleUrl: './pickup-request-list.scss',
})
export class PickupRequestList {
  public PRQCard: any[] = [];
  public PRQList: any[] = [];
  public totalItems: number = 0;
  public isShaking: boolean = false;
  public isDragOver = false;
  parsedPrqList: any[] = [];
  parsedTotalRows: number = 0;
  parsedValidRows: number = 0;
  parsedInvalidRows: number = 0;
  isParsingDone: boolean = false;
  private destroy$ = new Subject<void>();
  @ViewChild('addPRQ') addPRQ!: AddPrq;
  @ViewChild('addPrqPopup') addPrqPopup!: AddPrqPopup;
  @ViewChild('PrqDetail') PrqDetail!: PrqDetail;
  @ViewChild('PrqView') PrqView!: PrqView;
  public isExportLoading: boolean = false;
  public isLoading: boolean = false;
  @Output() prqSubmitted = new EventEmitter<void>();
  
  // Cancel Modal properties
  public cancelModalRef?: BsModalRef;
  public cancelPrqNo: string = '';
  public cancelReason: string = '';
  public isCancelSubmitted: boolean = false;
  @ViewChild('cancelPrqModal') cancelPrqModalTemplate!: TemplateRef<any>;

  // Upload Modal properties
  public uploadModalRef?: BsModalRef;
  public selectedFile: File | null = null;
  public selectedFileName: string = '';
  @ViewChild('uploadPrqModal') uploadPrqModalTemplate!: TemplateRef<any>;

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
      UserName:this.commonService.globalFilters.UserID.toString(),
      Status:"All",
      SearchText:this.commonService.globalFilters.searchText || "",
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
    this.prqSubmitted.emit();
  }

  downloadPRQ() {
    const payload = {
       "FilterJson": {
      ReportId:'222',
      FromDate: this.formatDate(this.commonService.globalFilters.startDate),
      ToDate: this.formatDate(this.commonService.globalFilters.endDate),
      BaseLocation: this.identityService.getBranchCode(),
      UserName:this.commonService.globalFilters.UserID.toString(),
      Status:"",
      SearchText:this.commonService.globalFilters.searchText || "",
      PageNo:this.commonService.globalFilters.Page.toString(),
      PageSize:this.commonService.globalFilters.PageSize.toString(),
      IsDownload:"1"
       }
    }
    this.isExportLoading = true;
    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        if (response && response.Table2 && response.Table2.length > 0) {
          const datePipe = new DatePipe('en-US');
          const formattedData = response.Table2.map((item: any) => ({
            ...item,
            PRQDate: item.PRQDate ? datePipe.transform(item.PRQDate, 'dd/MM/yyyy') : item.PRQDate,
            PlacementDate: item.PlacementDate ? datePipe.transform(item.PlacementDate, 'dd/MM/yyyy') : item.PlacementDate
          }));
          const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
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

  downloadTemplate() {
    this.PRQService.downloadTemplate().subscribe({
      next: (response: any) => {
        const blob: Blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, `PRQ_Template.xlsx`);
        this.isExportLoading = false;
      },
      error: (error: any) => {
        this.sweetAlertService.error(error?.error?.message || 'Download failed');
        this.isExportLoading = false;
      },
    });
  }


  openUploadModal() {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.isDragOver = false;
    this.parsedTotalRows = 0;
    this.parsedValidRows = 0;
    this.parsedInvalidRows = 0;
    this.isParsingDone = false;
    this.uploadModalRef = this.modalService.show(this.uploadPrqModalTemplate, { class: 'modal-dialog-centered upload-prq-modal modal-lg', backdrop: 'static' });
  }

  closeUploadModal() {
    this.uploadModalRef?.hide();
    this.selectedFile = null;
    this.selectedFileName = '';
    this.isDragOver = false;
    this.parsedPrqList = [];
    this.parsedTotalRows = 0;
    this.parsedValidRows = 0;
    this.parsedInvalidRows = 0;
    this.isParsingDone = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        this.selectedFile = file;
        this.selectedFileName = file.name;
      } else {
        this.sweetAlertService.error("Only .xls and .xlsx file types are supported.");
      }
    }
  }

  uploadAndParse(fileInput?: HTMLInputElement) {
    if (this.selectedFile) {
      const fileName = this.selectedFile.name.toLowerCase();
      if (!fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
        this.sweetAlertService.info("Only .xls and .xlsx file types are supported.");
        this.selectedFile = null;
        this.selectedFileName = '';
        if (fileInput) {
          fileInput.value = '';
        }
        return;
      }

      const payload = new FormData();
      payload.append('excelFile', this.selectedFile);

      this.isLoading = true;
      this.PRQService.validateData(payload).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response?.success) {
            this.parsedPrqList = response.items || [];
            this.parsedTotalRows = this.parsedPrqList.length;
            this.parsedValidRows = this.parsedPrqList.filter((x: any) => x.isValid).length;
            this.parsedInvalidRows = this.parsedPrqList.filter((x: any) => !x.isValid).length;
            this.isParsingDone = true;
          } else {
            this.sweetAlertService.error(response?.message || "Failed to parse file");
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.sweetAlertService.error(error?.error?.message || "Failed to parse file");
        }
      });
    }
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
        "UserName": this.commonService.globalFilters.UserID.toString(),
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

  onSubmitBulkUpload() {
    const now = new Date();
    const pad = (n: number) => n < 10 ? '0' + n : n;
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const payload = {
      items: this.parsedPrqList.map(item => ({
        ...item,
        prqDate: item.requiredPlacementDateTime
      })),
      baseLocation: this.identityService.getBranchCode() || '',
      baseUserName: this.commonService.globalFilters.UserID?.toString() || '',
      baseFinYear: this.identityService.getFinYear() || ''
    };

    this.isLoading = true;
    this.PRQService.uploadExcel(payload).subscribe({
      next: (response: Blob) => {
        this.isLoading = false;
        
        const blob: Blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, `Bulk_PRQ_Upload_Result.xlsx`);
        
        this.sweetAlertService.success("Bulk PRQ Submitted Successfully");
        this.closeUploadModal();
        this.getPRQList();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.sweetAlertService.error("Failed to submit bulk PRQ");
      }
    });
  }

}
