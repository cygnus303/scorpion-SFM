import { Component } from '@angular/core';
import { ExpenseGeneralService } from '../../shared/services/expense-general.service';
import { CommonService } from '../../shared/services/common.service';
import { Subject, takeUntil, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-my-customer-list',
  imports: [CommonModule, FormsModule, PaginationModule],
  templateUrl: './my-customer-list.html',
  styleUrl: './my-customer-list.scss',
})
export class MyCustomerList {
public isLoading:boolean = false;
public isExportLoading: boolean = false;
public customerList: any[] = [];
public summaryData:any = {};
private destroy$ = new Subject<void>();
private apiSubscription?: Subscription;


  constructor(
public expenseGeneralService:ExpenseGeneralService,
public commonService:CommonService,
private sweetAlertService: SweetAlertService
  ){}

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
          this.getMyCustomerList(false);
        });
  }

    formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  selectedRevenuePeriod: string = 'This Month';
  selectedStatus: string = 'All';

  setRevenuePeriod(period: string) {
    this.selectedRevenuePeriod = period;
      this.getMyCustomerList(true);
  }

  setStatus(status: string) {
    this.selectedStatus = status;
    this.commonService.globalFilters.Page = 1; // Reset to page 1 on filter change
    this.getMyCustomerList(false);
  }

  onPageChange(event: any) {
    const newPage = event.page || event;
    if (newPage > 0 && newPage !== this.commonService.globalFilters.Page) {
      this.commonService.globalFilters.Page = newPage;
      this.getMyCustomerList(false);
    }
  }

  getMyCustomerList(isRevenueUpdateOnly: boolean = false){
 const payload = {
      "FilterJson": {
        "ReportId": "383",
        "FromDate":this.formatDate(this.commonService.globalFilters.startDate),
        "ToDate":this.formatDate(this.commonService.globalFilters.endDate),
        "SearchText": this.commonService.globalFilters.searchText || "",
        "Status": this.selectedStatus,
        "RevenuePeriod": this.selectedRevenuePeriod,
         "PageNo": this.commonService.globalFilters.Page.toString(),
        "PageSize": this.commonService.globalFilters.PageSize.toString(),
        "UserId":this.commonService.globalFilters.UserID.toString(),
        }
      }
      if (this.apiSubscription) {
        this.apiSubscription.unsubscribe();
      }

      if (!isRevenueUpdateOnly) {
        this.isLoading = true;
        this.customerList = [];
      }
      this.apiSubscription = this.expenseGeneralService.getDynamicData(payload).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          
          if (response.Table1 && response.Table1.length > 0) {
            const stats = response.Table1[0];
            if (!isRevenueUpdateOnly) {
              this.summaryData = stats;
            }
          }

          const newTable = response.Table2 || [];
          if (isRevenueUpdateOnly && this.customerList.length > 0) {
            this.customerList.forEach(cust => {
              const match = newTable.find((n: any) => n.Custname === cust.Custname && n.ContractId === cust.ContractId);
              if (match) {
                cust.Revenue = match.Revenue;
              } else {
                cust.Revenue = 0;
              }
            });
          } else {
            this.customerList = newTable;
          }
        },
        error: (response: any) => {
          this.isLoading = false;
        }
      });
  }

  downloadXLS() {
    const payload = {
      "FilterJson": {
        "ReportId": "384",
        "FromDate": this.formatDate(this.commonService.globalFilters.startDate),
        "ToDate": this.formatDate(this.commonService.globalFilters.endDate),
        "SearchText": this.commonService.globalFilters.searchText || "",
        "Status": this.selectedStatus,
        "RevenuePeriod": this.selectedRevenuePeriod,
        "UserId": this.commonService.globalFilters.UserID.toString(),
      }
    };
 
    this.isExportLoading = true;
    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        if (response && response.Table1 && response.Table1.length > 0) {
          const formattedData = response.Table1;
          const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
          const workbook: XLSX.WorkBook = {
            Sheets: { 'Customer List': worksheet },
            SheetNames: ['Customer List'],
          };
          
          const excelBuffer: any = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
            cellStyles: false,
          });

          const blob: Blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          
          saveAs(blob, `Customer_List.xlsx`);
        } else {
          this.sweetAlertService.error('No data available to download');
        }
        this.isExportLoading = false;
      },
      error: (error: any) => {
        this.sweetAlertService.error(error?.error?.message || 'Download failed');
        this.isExportLoading = false;
      }
    });
  }
}
