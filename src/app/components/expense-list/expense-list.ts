import { Component, EventEmitter, OnInit, Output, inject, PLATFORM_ID, HostListener, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import {
  ExpenseDetailResponse,
  ExpenseResponse,
} from '../../shared/models/expense.model';
import { CommonService } from '../../shared/services/common.service';
import { ExpenseService } from '../../shared/services/expense.service';
import { ExportService } from '../../shared/services/export.service';
import { IdentityService } from '../../shared/services/identity.service';
import { CustomerService } from '../../shared/services/customer.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    PaginationModule,
    PopoverModule,
    BsDatepickerModule
  ],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss',
})
export class ExpenseList implements OnInit {
  public expense: string = '';
  public expenses: ExpenseResponse[] = [];
  public userType: string | null = null;
  public selectedExpense: ExpenseDetailResponse | null = null;
  public selectedCall: string | null = null;

  page = 1;
  pageSize = 10;
  totalItems = 0;
  filters: { [key: string]: any } = {};

  public cardList: string = 'Expenses';
  public selectedUser: any;
  public isAddExpenseLoad: boolean = false;
  public loading: boolean = false;

  @Output() edit = new EventEmitter<ExpenseResponse>();
  public isExportLoading = false;

  private expenseService = inject(ExpenseService);
  public commonService = inject(CommonService);
  private toasterService = inject(ToastrService);
  private exportService = inject(ExportService);
  public identifyService = inject(IdentityService);
  public customerService = inject(CustomerService);
  private platformId = inject(PLATFORM_ID);

  toggleActions(expense: ExpenseResponse) {
    const currentState = expense.showActions;
    this.expenses.forEach(e => e.showActions = false);
    expense.showActions = !currentState;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.expenses.forEach(e => e.showActions = false);
  }

  constructor() {
  }

  ngOnInit(): void {
    this.getExpenses();
    if (isPlatformBrowser(this.platformId)) {
      this.userType = localStorage.getItem('UserType');
    }
  }

  timeoutRef: any;
  onStartTimeChange() {
    clearTimeout(this.timeoutRef);
    this.timeoutRef = setTimeout(() => {
      this.getExpenses();
    }, 500);
  }

  getExpenses(page: number = 1) {
    this.loading = true;
    this.commonService.updateLoader(true);
    this.filters = Object.fromEntries(
      Object.entries(this.filters).filter(([key, value]) => value !== null && value !== '')
    );

    const filters: any = {
      ...this.filters,
      UserID: this.selectedUser ? this.selectedUser : this.identifyService.getLoggedUserId(),
      Page: page,
      PageSize: this.pageSize,
      ExpenseDate: this.filters['ExpenseDate'] ? this.commonService.formatDate(new Date(this.filters['ExpenseDate'])) : '',
      MeetingDate: this.filters['MeetingDate'] ? this.commonService.formatDate(new Date(this.filters['MeetingDate'])) : '',
    };

    this.expenseService.getExpenseList(filters).subscribe({
      next: (response) => {
        if (response) {
          this.expenses = response.data;
          this.totalItems = response.totalCount;
        }
        this.loading = false;
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.loading = false;
        this.commonService.updateLoader(false);
      },
    });
  }

  onPageChange(event: any): void {
    this.page = event.page;
    this.getExpenses(this.page);
  }

  exportExpenses(event: any) {
    event.preventDefault();
    const filters: any = {
      ...this.filters,
      UserId: this.identifyService.getLoggedUserId(),
      export: true
    };
    this.isExportLoading = true;
    this.expenseService.exportexport(this.selectedUser ? this.selectedUser : this.identifyService.getLoggedUserId(), '', '', filters).subscribe({
      next: (response: any) => {
        if (response) {
          this.exportService.exportToExcel(response?.data);
        }
        this.isExportLoading = false;
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.isExportLoading = false;
      },
    });
  }

  deleteExpense(customerCode: string) {
    this.loading = true;
    this.commonService.updateLoader(true);
    this.expenseService.deleteExpense(customerCode).subscribe({
      next: (response) => {
        if (response.success) {
          this.toasterService.success(response.data.message);
        } else {
          this.toasterService.error(response.error.message);
        }
        this.loading = false;
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.loading = false;
        this.commonService.updateLoader(false);
      },
    });
  }

  getExpense(data: any) {
    this.loading = true;
    this.commonService.updateLoader(true);
    const filter = {
      id: data.attendeeCode,
      userId: this.identifyService.getLoggedUserId()
    };
    this.expenseService.getExpenseDetails(filter.id, filter.userId).subscribe({
      next: (response) => {
        if (response) {
          this.selectedExpense = response.data;
          this.edit.emit(response.data);
        }
        this.loading = false;
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.loading = false;
        this.commonService.updateLoader(false);
      },
    });
  }

  clearDate() {
    this.filters['ExpenseDate'] = '';
    this.getExpenses();
  }

  clearmeetingDate() {
    this.filters['MeetingDate'] = '';
    this.getExpenses();
  }

  async closeEditModal() {
    if (isPlatformBrowser(this.platformId)) {
      const { Modal } = await import('bootstrap');
      const modalElement: any = document.getElementById('showModal');
      const modalInstance = Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
        document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
          backdrop.remove();
        });
        this.getExpenses();
      }
    }
  }

  async editModal(event: Event, expense: any, type: string) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('loginUser');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      if (parsedUser?.designationId === '') {
        Swal.fire({
          icon: 'info',
          text: 'You do not have a designation. Please contact the admin.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#405189',
          iconColor: '#405189'
        });
        return;
      }
      event.preventDefault();
      const { Modal } = await import('bootstrap');
      const modalElement = document.getElementById('showModal');
      if (modalElement) {
        const modal = new Modal(modalElement);
        modal.show();
        this.expense = type;
        this.isAddExpenseLoad = true;
        this.getExpense(expense);
      }
    }
  }

  async viewModal(event: Event, expenseId: any) {
    if (isPlatformBrowser(this.platformId)) {
      event.preventDefault();
      const { Modal } = await import('bootstrap');
      const modalElement = document.getElementById('showModalDetail');
      if (modalElement) {
        const modal = new Modal(modalElement);
        modal.show();
        this.getExpense(expenseId);
      }
    }
  }

  async approveModal(event: Event, expense: any) {
    if (isPlatformBrowser(this.platformId)) {
      event.preventDefault();
      const { Modal } = await import('bootstrap');
      const modalElement = document.getElementById('showApproveExpense');
      if (modalElement) {
        const modal = new Modal(modalElement);
        modal.show();
        this.selectedExpense = expense;
      }
    }
  }
}
