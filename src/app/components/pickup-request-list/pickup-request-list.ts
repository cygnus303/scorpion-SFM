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

@Component({
  selector: 'app-pickup-request-list',
  imports: [CommonModule, AddPrq, PaginationModule, FormsModule,PrqDetail],
  templateUrl: './pickup-request-list.html',
  styleUrl: './pickup-request-list.scss',
})
export class PickupRequestList {
  public PRQCard: any[] = [];
  public PRQList: any[] = [];
  public totalItems: number = 0;
  private destroy$ = new Subject<void>();
  @ViewChild('addPRQ') addPRQ!: AddPrq;
  @ViewChild('PrqDetail') PrqDetail!: PrqDetail;
  public isExportLoading: boolean = false;
  private sweetAlertService = inject(SweetAlertService);
  private identityService = inject(IdentityService);
  constructor(
    private PRQService: PrqService,
    public commonService: CommonService
  ) { }

  ngOnInit() {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getPRQCardList();
      this.getPRQList()
    });

  }

  selectPrqType(type: string) {
    this.addPRQ.showPopup(type);
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

  getPRQCardList() {
    const payload = {
      "fromDate": this.commonService.globalFilters.startDate,
      "toDate": this.commonService.globalFilters.endDate,
      "updateBy": this.commonService.globalFilters.UserID.toString(),
      "location": null,
      "type": "N"
    }
    this.PRQService.getPRQCard(payload).subscribe((response: any) => {
      this.PRQCard = response.data;
    });
  }

  getPRQList() {
    const formatDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split('/');
      const date = new Date(+year, +month - 1, +day);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(',', '').toLowerCase();
    };
    const payload = {
      startDate:  formatDate(this.commonService.globalFilters.startDate),
      endDate:formatDate(this.commonService.globalFilters.endDate),
      updateBy: this.commonService.globalFilters.UserID.toString(),
      baseLoc: this.identityService.getBranchCode(),
      type: "N",
      status: ""
    }
    this.PRQService.getPRQList(payload).subscribe((response: any) => {
      this.PRQList = response.data;
      this.totalItems = response.totalCount
    });
  }

  //   onPageChange(event: any): void {
  //   this.getPRQList(event.page);
  // }

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
