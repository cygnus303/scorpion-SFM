import { Component, inject, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-pickup-request-list',
  imports: [CommonModule, AddPrq, PaginationModule, FormsModule, PrqDetail,AddPrqPopup],
  templateUrl: './pickup-request-list.html',
  styleUrl: './pickup-request-list.scss',
})
export class PickupRequestList {
  public PRQCard: any[] = [];
  public PRQList: any[] = [];
  public totalItems: number = 0;
  private destroy$ = new Subject<void>();
  @ViewChild('addPRQ') addPRQ!: AddPrq;
  @ViewChild('addPrqPopup') addPrqPopup!: AddPrqPopup;
  @ViewChild('PrqDetail') PrqDetail!: PrqDetail;
  public isExportLoading: boolean = false;
  public isLoading: boolean = false;
  private sweetAlertService = inject(SweetAlertService);
  private identityService = inject(IdentityService);
  constructor(
    private PRQService: PrqService,
    public commonService: CommonService
  ) { }

  ngOnInit() {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // this.getPRQCardList();
      this.getPRQList()
    });

  }

  selectPrqType() {
    // this.addPRQ.showPopup();
    this.addPrqPopup.showPopup();
  }

  openPRQDetailModal(indentNo?: any) {
    this.PrqDetail.showPopup(() => {
      return this.PRQService.GetPRQDetails(indentNo);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // getPRQCardList() {
  //   const payload = {
  //     "fromDate": this.formatDate(this.commonService.globalFilters.startDate),
  //     "toDate": this.formatDate(this.commonService.globalFilters.endDate),
  //     "updateBy": this.commonService.globalFilters.UserID.toString(),
  //     "location": null,
  //     "type": "N"
  //   }
  //   this.PRQService.getPRQCard(payload).subscribe((response: any) => {
  //     this.PRQCard = response.data;
  //   });
  // }

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
      startDate: this.formatDate(this.commonService.globalFilters.startDate),
      endDate: this.formatDate(this.commonService.globalFilters.endDate),
      Page: this.commonService.globalFilters.Page.toString(),
      pageSize: this.commonService.globalFilters.PageSize.toString(),
      updateBy: this.commonService.globalFilters.UserID.toString(),
      baseLoc: this.identityService.getBranchCode(),
      type: "N",
      status: ""
    }
    this.PRQService.getPRQList(payload).subscribe((response: any) => {
      this.isLoading = false;
      this.PRQList = response.data;
      this.totalItems = response.totalCount
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
    const params = {
      updateBy: this.commonService.globalFilters.UserID.toString(),
      baseLoc: this.identityService.getBranchCode(),
    };
    this.isExportLoading = true;
    this.PRQService.DownloadPRQ(params).subscribe({
      next: (blob: Blob) => {
        saveAs(blob, `PRQ_Report_${new Date().getTime()}.xlsx`);
        this.isExportLoading = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response.error?.message || 'Download failed');
        this.isExportLoading = false;
      },
    });
  }


}
