import { Component, EventEmitter, Output } from '@angular/core';
import { CustomerService } from '../../shared/services/customer.service';
import { CommonService } from '../../shared/services/common.service';
import { ExportService } from '../../shared/services/export.service';
import { MeetingService } from '../../shared/services/meeting.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { CustomerFilter, CustomerResponse } from '../../shared/models/customer.model';
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
  public startDate!: string;
  public endDate!: string;
  getCustomerfilter!: CustomerFilter;
  selectedCustomer: CustomerResponse | null = null;
  page = 1; // Current page number
  pageSize = 10; // Number of items per page
  totalItems = 0; // Total number of items
  filters: { [key: string]: string } = {}; // Dynamic filter object
  public isCallLoad: boolean = false;
  public isMeetingLoad: boolean = false;
  public loading: boolean = false;
  placeholderArray = Array(7);
  public isCardLoading: boolean = false;
  public isExportLoading = false;

  @Output() edit = new EventEmitter<CustomerResponse>();
  dateRange: [Date, Date] = [new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)];
  selectedCustomerName: any;
  checkOutValue: string = '';
  private destroy$ = new Subject<void>();

  // ranges: IRange[] = [
  //   {
  //     value: [new Date(new Date().setDate(new Date().getDate() - 7)), new Date()],
  //     label: 'Last 7 Days',
  //   },
  //   {
  //     value: [new Date(), new Date()],
  //     label: 'Today',
  //   },
  //   {
  //     value: [
  //       new Date(new Date().setDate(new Date().getDate() - 1)),
  //       new Date(new Date().setDate(new Date().getDate() - 1)),
  //     ],
  //     label: 'Yesterday',
  //   },
  //   {
  //     value: [new Date(new Date().setDate(new Date().getDate() - 30)), new Date()],
  //     label: 'Last 30 Days',
  //   },
  //   {
  //     value: [
  //       new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  //       new Date(),
  //     ],
  //     label: 'This Month',
  //   },
  //   {
  //     value: [
  //       new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
  //       new Date(new Date().getFullYear(), new Date().getMonth(), 0),
  //     ],
  //     label: 'Last Month',
  //   },
  //   {
  //     value: [
  //       new Date(new Date().getFullYear(), 0, 1), // First day of the year
  //       new Date(new Date().getFullYear(), 11, 31), // Last day of the year
  //     ],
  //     label: 'This Year',
  //   },
  // ];

  constructor(
    private customerService: CustomerService,
    public commonService: CommonService,
    private sweetAlertService: SweetAlertService,
    private exportService: ExportService,
    private meetingService: MeetingService,
  ) { }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getCustomers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // getCustomerfilters(event:any){
  //   this.getfilter=[];
  //   this.startDate= event?.[0] ? event[0].toLocaleDateString("en-GB") : this.dateRange?.[0]?.toLocaleDateString("en-GB") || null,
  //   this.endDate = event?.[1]  ? event[1].toLocaleDateString("en-GB") : this.dateRange?.[1]?.toLocaleDateString("en-GB") || null
  //   if(event?.length){
  //     const filters = {
  //       userid:this.identityService.getLoggedUserId(),
  //       // startdate:this.startDate,
  //       // enddate:this.endDate
  //     }
  //     this.isCardLoading=true;
  //   this.customerService.getLeadCustomerfilters(filters).subscribe({
  //     next:(response) =>{
  //       this.getCustomerfilter = response.data;
  //       this.getfilter = [
  //         { name: "Total Customers", count: response.data.customerCount || 0 ,color:'green' },
  //         { name: "Total Sales", count: response.data.totalSales || 0 ,color:'wheat' },
  //         { name: "Overdue O/s", count: response.data.overdueOS || 0 ,color:'pink' },
  //         { name: "Total O/s", count: response.data.totalOS || 0 ,color:'lightgreen' },
  //         { name: "NBD", count: response.data.nbd || 0 ,color:'blue' },
  //         { name: "Lost Customer", count: response.data.lostCustomerCount || 0 ,color:'purple ' },
  //         { name: "Yield", count: response.data.yield || 0 ,color:'bluecolor' },
  //       ];
  //     this.isCardLoading=false;

  //     },
  //     error: (response: any) => {
  //       this.sweetAlertService.error(response);
  //     this.isCardLoading=false;

  //     },
  //   });
  //   }
  //   this.getCustomers()
  // }

  onQuatation(event: Event, customer: any) {
    event.preventDefault();
    const filters = {
      customerName: customer.customerName,
      token: localStorage.getItem('token')
    }
    console.log(filters)
  }

  exportCustomers(event: any) {
    event.preventDefault();
    this.isExportLoading = true;
    this.customerService.exportCustomer(this.filters).subscribe({
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

  exportCSVCustomers(event: any) {
    event.preventDefault();
    this.commonService.updateLoader(true);
    this.customerService.exportCustomer(this.filters).subscribe({
      next: (response) => {
        if (response) {
          this.exportService.exportToCSV(response.data);
        }
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.commonService.updateLoader(false);
      },
    });
  }
  getCustomers(page: number = 1) {
    this.filters = Object.fromEntries(
      Object.entries(this.filters).filter(([key, value]) => value !== null)
    );
    this.commonService.updateLoader(true);
    const filters: any = {
      ...this.filters,
      Page: this.commonService.globalFilters.Page.toString(),
      UserID: this.commonService.globalFilters.UserID.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate
    };
    this.customerService.getCustomerList(filters).subscribe({
      next: (response) => {
        if (response) {
          this.customers = response.data;
          this.totalItems = response.totalCount;
        }
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.commonService.updateLoader(false);
      },
    });
  }

  clearDate() {
    if (this.filters['StartDate']) {
      this.filters['StartDate'] = '';
    } else {
      this.filters['EndDate'] = '';
    }
    this.getCustomers();;
  }

  deleteCustomer(customerCode: string) {
    this.commonService.updateLoader(true);
    this.customerService.deleteCustomer(customerCode).subscribe({
      next: (response) => {
        if (response.success) {
          this.sweetAlertService.success(response.data.message);
        } else {
          this.sweetAlertService.error(response.error.message);
        }

        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.commonService.updateLoader(false);
      },
    });
  }


  getCustomer(customerCode: string) {
    this.commonService.updateLoader(true);
    this.customerService.getCustomerDetails(customerCode).subscribe({
      next: (response) => {
        if (response) {
          this.selectedCustomer = response.data;
          this.edit.emit(response.data);
        }
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.commonService.updateLoader(false);
      },
    });
  }

  onPageChange(event: any) {
    this.getCustomers(event.page);
  }
}
