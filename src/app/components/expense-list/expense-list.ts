import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseResponse } from '../../shared/models/expense.model';
import { CommonService } from '../../shared/services/common.service';
import { ExpenseService } from '../../shared/services/expense.service';
import { ExportService } from '../../shared/services/export.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { ExpenseDetail } from './expense-detail/expense-detail';
import { AddExpense } from './add-expense/add-expense';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { Subject, takeUntil } from 'rxjs';
import { ExpenseClaim } from './expense-claim/expense-claim';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    PaginationModule,
    PopoverModule,
    BsDatepickerModule,
    ExpenseDetail,
    AddExpense, ExpenseClaim
  ],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss',
})
export class ExpenseList implements OnInit {
  public totalItems: number = 0;
  public expense: string = '';
  public expenses: ExpenseResponse[] = [];
  public loading: boolean = false;
  public isExportLoading = false;
  public expenseCard: any;
  private destroy$ = new Subject<void>();

  @ViewChild('expenseDetail') expenseDetail!: ExpenseDetail;
  @ViewChild('addExpense') addExpense!: AddExpense;
  @ViewChild('ExpenseClaim') ExpenseClaim!: ExpenseClaim;

  constructor(private sweetAlertService: SweetAlertService, private expenseService: ExpenseService,
    private exportService: ExportService,
    public commonService: CommonService,
  ) { }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getExpenses();
      this.onExpenseCard();
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
      // startDate: this.commonService.globalFilters.startDate,
      // endDate: this.commonService.globalFilters.endDate,
      userId: this.commonService.globalFilters.UserID.toString(),
    }
    this.loading = true;
    this.expenseService.getExpenseList(data).subscribe({
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

  onExpenseCard() {
    const params = {
      // startDate: this.commonService.globalFilters.startDate,
      // endDate: this.commonService.globalFilters.endDate,
      userId: this.commonService.globalFilters.UserID.toString(),
    }
    this.expenseService.expenseCard(params).subscribe({
      next: (response: any) => {
        if (response) {
          this.expenseCard = response.data;
        }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
    });
  }

  onPageChange(event: any): void {
    this.getExpenses(event.page);
  }

  onDataEmitter() {
    this.getExpenses();
    this.onExpenseCard();
  }

  exportExpenses() {
    const data = {
      export: true,
      // startDate: this.commonService.globalFilters.startDate,
      // endDate: this.commonService.globalFilters.endDate,
    }
    this.isExportLoading = true;
    this.expenseService.exportexport(this.commonService.globalFilters.UserID, '', '', '').subscribe({
      next: (response: any) => {
        if (response) {
          this.exportService.exportToExcel(response?.data);
        }
        this.isExportLoading = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.isExportLoading = false;
      },
    });
  }

  viewModal(data: any) {
    this.expenseDetail.showPopup(() => {
      return this.expenseService.getExpenseDetails(data.attendeeCode, this.commonService.globalFilters.UserID.toString());
    });
  }

  editModal(data: ExpenseResponse) {
    this.addExpense.showPopup(() => {
      return this.expenseService.getExpenseDetails(data.attendeeCode, this.commonService.globalFilters.UserID.toString());
    });
  }

  claimModal(data: ExpenseResponse) {
    this.ExpenseClaim.showPopup(() => {
      return this.expenseService.getExpenseDetails(data.attendeeCode, this.commonService.globalFilters.UserID.toString());
    });
  }
}
