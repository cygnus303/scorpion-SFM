import { Component, EventEmitter, Output } from '@angular/core';
import { CustomerService } from '../../shared/services/customer.service';
import { CommonService } from '../../shared/services/common.service';
import { ExportService } from '../../shared/services/export.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { CustomerResponse } from '../../shared/models/customer.model';
import { CommonModule } from '@angular/common';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-customer-list',
  imports: [CommonModule, PaginationModule, FormsModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomerList {
  public customers: CustomerResponse[] = [];
  totalItems = 0; // Total number of items
  public loading: boolean = false;
  public isExportLoading = false;
  public getCustomerCount: any;

  @Output() edit = new EventEmitter<CustomerResponse>()
  private destroy$ = new Subject<void>();

  constructor(
    private customerService: CustomerService,
    public commonService: CommonService,
    private sweetAlertService: SweetAlertService,
    private exportService: ExportService,
  ) { }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getCustomers();
      this.getCustomerfilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  exportCustomers() {
    this.isExportLoading = true;
    const filters: any = {
      SearchFilter: this.commonService.globalFilters.searchText,
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate
    };
    this.customerService.exportCustomer(filters).subscribe({
      next: (response) => {
        if (response) {
          this.exportService.exportToExcel(response.data);
        }
        this.isExportLoading = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.isExportLoading = false;
      },
    });
  }

  getCustomers(page: number = this.commonService.globalFilters.Page) {
    this.commonService.globalFilters.Page = page;
    const filters: any = {
      Page: this.commonService.globalFilters.Page.toString(),
      UserID: this.commonService.globalFilters.UserID.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      SearchFilter: this.commonService.globalFilters.searchText,
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate
    };
    this.customerService.getCustomerList(filters).subscribe({
      next: (response) => {
        if (response) {
          this.customers = response.data;
          this.totalItems = response.totalCount;
        }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
    });
  }

  onPageChange(event: any) {
    this.getCustomers(event.page);
  }

  getCustomerfilters() {
    const filters: any = {
      UserID: this.commonService.globalFilters.UserID.toString(),
    };
    this.customerService.getCustomerfilters(filters).subscribe({
      next: (response) => {
        this.getCustomerCount = response.data;
      }
    });
  }
}
