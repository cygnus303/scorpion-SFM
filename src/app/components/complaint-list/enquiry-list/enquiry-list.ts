import { Component, inject, ViewChild } from '@angular/core';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { CommonService } from '../../../shared/services/common.service';
import { ComplaintResponse } from '../../../shared/models/complaint.model';
import { Subject, takeUntil } from 'rxjs';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { EnquiryDetail } from '../enquiry-detail/enquiry-detail';

@Component({
  selector: 'app-enquiry-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationModule,EnquiryDetail],
  templateUrl: './enquiry-list.html',
  styleUrl: './enquiry-list.scss',
})
export class EnquiryList {
  public enquiryList: ComplaintResponse[] = [];
  public isLoading: boolean = false;
  public totalItems: number = 0;
  @ViewChild('EnquiryDetail') EnquiryDetail!: EnquiryDetail;
  private sweetAlertService = inject(SweetAlertService);
  public complaintService = inject(ComplaintService);
  public commonService = inject(CommonService); // Public to access globalFilters in HTML
  private destroy$ = new Subject<void>()

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getEnquiryList();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getEnquiryList(page: number = this.commonService.globalFilters.Page) {
    this.commonService.globalFilters.Page = page;
    const data = {
      Page: this.commonService.globalFilters.Page.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      SearchFilter: this.commonService.globalFilters.searchText,
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate,
      userId: this.commonService.globalFilters.UserID.toString(),
    }
    this.isLoading = true;
    this.complaintService.getGetEnquiryList(data).subscribe({
      next: (response: any) => {
        if (response) {
          this.enquiryList = response.data;
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

   viewModal(id: any) {
    this.EnquiryDetail.showPopupWithLoading(() => {
      return this.complaintService.GetEnquiryDetail(id, this.commonService.globalFilters.UserID.toString());
    });
  }
}
