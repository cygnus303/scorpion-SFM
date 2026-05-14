import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../../shared/services/common.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GeneralMasterResponseList } from '../../shared/models/expenseGeneral.model';
import { ExpenseGeneralService } from '../../shared/services/expense-general.service';
import { ExportService } from '../../shared/services/export.service';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ExpenseGeneralmasterDetail } from './expense-generalmaster-detail/expense-generalmaster-detail';
import { AddExpenseGeneralMaster } from './add-expense-general-master/add-expense-general-master';

@Component({
  selector: 'app-expense-general-master',
  standalone: true,
  imports: [CommonModule, FormsModule, PopoverModule, PaginationModule, ExpenseGeneralmasterDetail, AddExpenseGeneralMaster],
  templateUrl: './expense-general-master.html',
  styleUrl: './expense-general-master.scss',
})
export class ExpenseGeneralMaster implements OnInit, OnDestroy {
  public expenses: GeneralMasterResponseList[] = [];
  public totalItems: number = 0;
  public isExportLoading: boolean = false;
  public isLoading: boolean = false;

  private expenseGeneralService = inject(ExpenseGeneralService);
  public commonService = inject(CommonService); // Public to access globalFilters in HTML
  private toasterService = inject(ToastrService);
  private exportService = inject(ExportService);

  @ViewChild('expenseGeneralmasterDetail') expenseGeneralmasterDetail!: ExpenseGeneralmasterDetail;
  @ViewChild('addExpenseGeneralMaster') addExpenseGeneralMaster!: AddExpenseGeneralMaster;

  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getExpensesGeneralMaster();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  getExpensesGeneralMaster(page: number = this.commonService.globalFilters.Page) {
    this.commonService.globalFilters.Page = page;
    const data = {
      Page: this.commonService.globalFilters.Page.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      SearchFilter: this.commonService.globalFilters.searchText,
      // startDate: this.commonService.globalFilters.startDate,
      // endDate: this.commonService.globalFilters.endDate,
      export: false
    }
    this.isLoading = true;
    this.expenseGeneralService.getGeneralmasterList(data).subscribe({
      next: (response: any) => {
        if (response) {
          this.expenses = response.data;
          this.totalItems = Number(response.totalCount) || 0;
        }
        this.isLoading = false;
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: any): void {
    this.getExpensesGeneralMaster(event.page);
  }

  openExpenseGeneralmasterDetailModal(data?: any) {
    this.expenseGeneralmasterDetail.showPopup(data);
  }

  openAddExpenseModal(data?: any) {
    this.addExpenseGeneralMaster.showPopup(data);
  }

  downloadExpenseGeneral() {
    const data = {
      Page: this.commonService.globalFilters.Page.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      // startDate: this.commonService.globalFilters.startDate,
      // endDate: this.commonService.globalFilters.endDate,
      export: true
    }
    this.isExportLoading = true;
    this.expenseGeneralService.getGeneralmasterList(data).subscribe({
      next: (response) => {
        if (response) {
          this.exportService.exportToExcel(response.data);
        }
        this.isExportLoading = false;
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.isExportLoading = false;
      },
    });
  }

}
