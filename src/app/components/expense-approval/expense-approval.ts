import { Component } from '@angular/core';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { CommonService } from '../../shared/services/common.service';
import { ExpenseResponse } from '../../shared/models/expense.model';
import { Subject, takeUntil } from 'rxjs';
import { ExpenseService } from '../../shared/services/expense.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-approval',
  imports: [CommonModule],
  templateUrl: './expense-approval.html',
  styleUrl: './expense-approval.scss',
})
export class ExpenseApproval {
  public totalItems: number = 0;
  public expenses: ExpenseResponse[] = [];
  public loading: boolean = false;
  public isExportLoading = false;
  private destroy$ = new Subject<void>();

  constructor(private sweetAlertService: SweetAlertService, private expenseService: ExpenseService,
    public commonService: CommonService,
  ) { }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getExpenses();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getExpenses(page: number = this.commonService.globalFilters.Page) {
    this.commonService.globalFilters.Page = page;
    const data = {
      Page: this.commonService.globalFilters.Page.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      SearchFilter: this.commonService.globalFilters.searchText,
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate,
      userId: this.commonService.globalFilters.UserID.toString(),
    }
    this.loading = true;
    this.expenseService.getExpenseApprovalList(data).subscribe({
      next: (response) => {
        if (response) {
          this.expenses = response.data;
          this.totalItems = response.totalCount;
        }
        this.loading = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.loading = false;
      },
    });
  }

  onPageChange(event: any): void {
    this.getExpenses(event.page);
  }
}
