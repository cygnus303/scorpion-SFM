import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { CommonService } from '../../shared/services/common.service';
import { ExpenseResponse } from '../../shared/models/expense.model';
import { Subject, takeUntil } from 'rxjs';
import { ExpenseService } from '../../shared/services/expense.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ExportService } from '../../shared/services/export.service';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ExpenseDetail } from '../expense-list/expense-detail/expense-detail';
import { PopoverModule } from 'ngx-bootstrap/popover';

@Component({
  selector: 'app-expense-approval',
  imports: [CommonModule, FormsModule, PaginationModule, ExpenseDetail, PopoverModule],
  templateUrl: './expense-approval.html',
  styleUrl: './expense-approval.scss',
})
export class ExpenseApproval {
  public totalItems: number = 0;
  public expenses: ExpenseResponse[] = [];
  public loading: boolean = false;
  public isExportLoading = false;
  public isApprovalExportLoading = false;
  private destroy$ = new Subject<void>();
  modalRef!: BsModalRef;
  isDefaultComment: string = '';
  typeEvent: string = '';
  public expenseList!: ExpenseResponse;
  public selectedIds: Set<any> = new Set();
  public selectAll: boolean = false;
  public selectedAny: boolean = false;
  public approvalCard: any;
  @ViewChild('expenseDetail') expenseDetail!: ExpenseDetail;
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;
  @ViewChild('TemplateMultipleApproval') TemplateMultipleApproval!: TemplateRef<any>;
  private exportService = inject(ExportService);
  constructor(
    private sweetAlertService: SweetAlertService,
    private expenseService: ExpenseService,
    public commonService: CommonService,
    private modalService: BsModalService,
  ) { }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getExpenses();
      this.getapprovalCard();
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

  showRejectModal(expense: ExpenseResponse, type: string): void {
    this.typeEvent = type;
    this.expenseList = expense;
    this.modalRef = this.modalService.show(this.Templatepod, {
      class: 'modal-lg modal-dialog-centered modal-width',
      backdrop: true,
      ignoreBackdropClick: true
    });
  }


  openReasonSwal(type: string) {
    this.typeEvent = type;
    this.modalRef = this.modalService.show(this.TemplateMultipleApproval, {
      class: 'modal-lg modal-dialog-centered modal-width',
      backdrop: true,
      ignoreBackdropClick: true
    });
  }

  updateAdditionalInfo(event: any) {
    if (this.typeEvent === 'Approve') {
      this.handleApproval(true, event);
    } else if (this.typeEvent === 'Reject') {
      this.handleApproval(false, event)
    }
  }

  onSubmit() {
    if (this.typeEvent === 'Approve') {
      this.getSelectedJSON(true);
    } else if (this.typeEvent === 'Reject') {
      this.getSelectedJSON(false)
    }
  }

  getSelectedJSON(isApproved: boolean = false) {
    const selectedRows = this.expenses
      .filter(x => x.isSelected)
      .map(x => ({
        attendeeCode: x.attendeeCode,
        expenseId: x.expenseCode,
        meetingId: x.meetingId
      }));

    const payload = {
      approvedBy: this.commonService.globalFilters.UserID.toString(),
      isApproved: isApproved,
      reasonRemark: this.isDefaultComment,
      isSelectAll: false,
      jsonData: selectedRows,
      startDate: null,
      endDate: null,
      filterJson: null
    };
    this.expenseService.multipleExpenseApproval(payload).subscribe({
      next: (response: any) => {
        if (response?.success) {
          this.sweetAlertService.success(response.data.message);
          this.onCancel();
          this.getExpenses()
          this.getapprovalCard();
        } else {
          this.sweetAlertService.error(response?.error?.message || 'Something went wrong');
        }
      },

      error: (err) => {
        this.sweetAlertService.error(err?.error?.message || 'Server error');
      },

    });
  }

  handleApproval(isApproved: boolean, reasonRemark: string): void {
    const data = {
      expenseId: this.expenseList.expenseCode,
      meetingId: this.expenseList.meetingId,
      attendeeCode: this.expenseList.attendeeCode,
      isApproved: isApproved,
      approvedBy: this.commonService.globalFilters.UserID.toString(),
      reasonRemark: reasonRemark,
    };

    this.expenseService.expenseApproval(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.sweetAlertService.success(response.data.message);
          // Close modal after success
          this.modalRef.hide();
          // Refresh expense list
          this.getExpenses();
          this.getapprovalCard();
        } else {
          this.sweetAlertService.error(response.error?.message);
        }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response.error?.message);
      },
    });
  }

  onCancel(): void {
    this.modalRef.hide();
  }

  onRowSelect(expense: any) {
    if (expense.isSelected) {
      this.selectedIds.add(expense.expenseCode);
    } else {
      this.selectedIds.delete(expense.expenseCode);
    }

    this.updateSelectedAny();
    if (!expense.isSelected) {
      this.selectAll = false;
      return;
    }

    // Check if all selectable rows are selected
    const allChecked = this.expenses.every((x: any) =>
      x.isSelected ||
      x.isManager_AuditApproved ||
      x.createdBy === this.commonService.globalFilters.UserID ||
      x.isEdit === 'Y'
    );

    this.selectAll = allChecked;
  }

  updateSelectedAny() {
    this.selectedAny = this.expenses.some(e => e.isSelected);
  }

  toggleSelectAll() {
    this.expenses.forEach(expense => {
      const isDisabled =
        expense.isManager_AuditApproved ||
        expense.createdBy === this.commonService.globalFilters.UserID ||
        expense.isEdit === 'Y';

      if (!isDisabled) {
        expense.isSelected = this.selectAll;
      }
    });

    this.updateSelectedAny();
  }


  exportExpenses() {
    const filters = {
      Page: this.commonService.globalFilters.Page.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate,
      userId: this.commonService.globalFilters.UserID.toString(),
    }
    this.isExportLoading = true;
    this.expenseService.exportExpense(filters).subscribe({
      next: (response) => {
        if (response) {
          this.exportService.exportToExcel(response.data);
        }
        this.isExportLoading = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response.error.message);
        this.isExportLoading = false;
      },
    });
  }

  downLoadAuditorExpense() {
    this.isApprovalExportLoading = true;
    this.expenseService
      .downloadAuditorExpense(this.commonService.globalFilters.UserID.toString())
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.exportService.exportToExcel(response.data);
          }
        },
        error: (err: any) => {
          console.log(err);
          this.sweetAlertService.error(
            err?.error?.message || 'Something went wrong'
          );
        },
        complete: () => {
          this.isApprovalExportLoading = false;
        }
      });
  }

  getapprovalCard() {
    const params = {
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate,
      userId: this.commonService.globalFilters.UserID.toString(),
    }

    this.expenseService.ApprovalDashboardCards(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.approvalCard = response.data;
        }
      }
    });
  }

  viewModal(data: any) {
    this.expenseDetail.showPopup(() => {
      return this.expenseService.getExpenseDetails(data.attendeeCode, this.commonService.globalFilters.UserID.toString());
    });
  }
}
