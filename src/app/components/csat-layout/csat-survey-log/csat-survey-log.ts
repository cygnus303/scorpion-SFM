import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { Subject, takeUntil } from 'rxjs';
import { ExternalService } from '../../../shared/services/external.service';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { CommonService } from '../../../shared/services/common.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { CsatSurveyView } from '../csat-survey-view/csat-survey-view';

@Component({
  selector: 'app-csat-survey-log',
  imports: [CommonModule, NgSelectModule, FormsModule, PaginationModule,CsatSurveyView],
  templateUrl: './csat-survey-log.html',
  styleUrl: './csat-survey-log.scss',
})
export class CsatSurveyLog implements OnInit, OnDestroy {
  @ViewChild('CsatSurveyView') CsatSurveyView!: CsatSurveyView;
  public surveys: any[] = [];
  public totalItems = 0;
  public loading = false;
 
  // Filter properties
  public statusList = ['Pending', 'Responded', 'Expired'];
  public triggerList: any[] = [];
  public selectedStatus: string | null = null;
  public selectedTrigger: any = null;
 
  private destroy$ = new Subject<void>();
  private externalService = inject(ExternalService);
  private expenseGeneralService = inject(ExpenseGeneralService);
  public commonService = inject(CommonService);
  private sweetAlertService = inject(SweetAlertService);
 
  ngOnInit(): void {
    this.loadTriggers();
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadSurveyLogs();
    });
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 
  loadTriggers() {
    this.expenseGeneralService.getGeneralMaster(null, 'SurveyTrigger').subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.triggerList = response.data;
        }
      },
      error: (err: any) => {
        console.error('Error loading triggers:', err);
      }
    });
  }
 
  loadSurveyLogs(page: number = this.commonService.globalFilters.Page) {
    this.loading = true;
    this.commonService.globalFilters.Page = page;
    const payload = {
      pageNumber: this.commonService.globalFilters.Page,
      pageSize: this.commonService.globalFilters.PageSize,
      status: this.selectedStatus || "",
      triggerId: this.selectedTrigger ? String(this.selectedTrigger) : ""
    };
 
    this.externalService.getCSATSurveyLog(payload).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response && response.success && response.data) {
          this.surveys = response.data.data || [];
          this.totalItems = response.data.totalRecords || 0;
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error fetching survey logs:', err);
      }
    });
  }

  onPageChange(event: any) {
    this.loadSurveyLogs(event.page);
  }

  resendSurvey(custCode: string) {
    if (!custCode) {
      this.sweetAlertService.error('Customer code is missing.');
      return;
    }

    this.externalService.resendCSATSurvey(custCode).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.sweetAlertService.success(response.data?.message || 'Survey email resent successfully!');
          this.loadSurveyLogs();
        } else {
          this.sweetAlertService.error(response?.error?.message || 'Failed to resend survey.');
        }
      },
      error: (err: any) => {
        this.sweetAlertService.error(err?.error?.message || 'Error occurred while resending survey.');
      }
    });
  }

  viewSurvey(custCode: string) {
    this.CsatSurveyView.showPopup(() => {
      return this.externalService.viewCSATSurvey(custCode);
    });
  }
}
