import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { Subject, takeUntil } from 'rxjs';
import { ExternalService } from '../../../shared/services/external.service';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'app-csat-survey-log',
  imports: [CommonModule, NgSelectModule, FormsModule, PaginationModule],
  templateUrl: './csat-survey-log.html',
  styleUrl: './csat-survey-log.scss',
})
export class CsatSurveyLog implements OnInit, OnDestroy {
  public surveys: any[] = [];
  public totalItems = 0;

  // Filter properties
  public statusList = ['Pending', 'Responded', 'Expired'];
  public triggerList: any[] = [];
  public selectedStatus: string | null = null;
  public selectedTrigger: any = null;

  private destroy$ = new Subject<void>();
  private externalService = inject(ExternalService);
  private expenseGeneralService = inject(ExpenseGeneralService);
  public commonService = inject(CommonService);

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
    this.commonService.globalFilters.Page = page;
    const payload = {
      pageNumber: this.commonService.globalFilters.Page,
      pageSize: this.commonService.globalFilters.PageSize,
      status: this.selectedStatus || "",
      triggerId: this.selectedTrigger ? String(this.selectedTrigger) : ""
    };

    this.externalService.getCSATSurveyLog(payload).subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          this.surveys = response.data.data || [];
          this.totalItems = response.data.totalRecords || 0;
        }
      },
      error: (err: any) => {
        console.error('Error fetching survey logs:', err);
      }
    });
  }

  onPageChange(event: any) {
    this.loadSurveyLogs(event.page);
  }

}
