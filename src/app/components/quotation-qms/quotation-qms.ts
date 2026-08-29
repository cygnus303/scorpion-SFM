import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddKycPopupComponent } from './add-kyc-popup/add-kyc-popup';
import { QmViewPopupComponent } from './qm-view-popup/qm-view-popup';
import { SendForApprovalPopupComponent } from './send-for-approval-popup/send-for-approval-popup';
import { AddQmComponent } from './add-qm/add-qm.component';
import { ExpenseGeneralService } from '../../shared/services/expense-general.service';
import { CommonService } from '../../shared/services/common.service';
import { IdentityService } from '../../shared/services/identity.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { debounceTime, Subject, Subscription, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { Quotation } from '../../shared/services/quotation';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-quotation-qms',
  standalone: true,
  imports: [CommonModule, AddKycPopupComponent, QmViewPopupComponent, SendForApprovalPopupComponent, FormsModule,PaginationModule,NgSelectModule, AddQmComponent],
  templateUrl: './quotation-qms.html',
  styleUrl: './quotation-qms.scss',
})
export class QuotationQMS {
  public listSubscription ?:Subscription;
    private destroy$ = new Subject<void>();
  private fetchSubject = new Subject<void>();
  public isLoading : boolean =false;
  public totalItems: number = 0;
  public quotationList: any[] = [];
  public cardList: any[] = [];
  public customerData:any[]=[];
  public currentScreen: 'list' | 'add-qm' = 'list';
  public selectedCustomerDataForQm: any = null;

  public config = {
    fromDateStr: new Date(),
    toDateStr: new Date(),
    Status: 'Total Prospect',
    PageNo: 1,
    PageSize: 10,
    totalRecords: 0,
    totalPages: 1,
    SearchCustCd: null,
    QuotationType:'Prospect Wise',
    IsActive:''
  };
  @ViewChild(AddKycPopupComponent) addKycPopup!: AddKycPopupComponent;
  @ViewChild(QmViewPopupComponent) qmViewPopup!: QmViewPopupComponent;
  @ViewChild(SendForApprovalPopupComponent) sendForApprovalPopup!: SendForApprovalPopupComponent;

  constructor(
    private expenseGeneralService:ExpenseGeneralService,
    public commonService:CommonService,
    private sweetAlertService:SweetAlertService,
    private identityService:IdentityService,
    private quotationService:Quotation
  ){}

  ngOnInit(){
     this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
          this.getQuatationList();
        });

          this.fetchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.getQuatationList();
    });

    this.fetchData();
    this.getCustomerDetail();
  }

    fetchData() {
    this.config.PageNo = 1;
    this.fetchSubject.next();
  }

  openKycPopup(item?: any) {
    if (this.addKycPopup) {
      if (item && typeof item === 'object') {
        const custCode = item.CUSTCD || item.LeadId || item.ContractID;
        const custName = item.ProspectName || item.CustName;
        const isEdit = item.IsKYCdone === 'Y' || item.ProspectStatus === 'KYC Generated' || item.ProspectStatus === 'Customer Created';
        this.addKycPopup.show(custCode, custName, isEdit);
      } else {
        this.addKycPopup.show(item);
      }
    }
  }

  openQmViewPopup(custCode:string) {
    if (this.qmViewPopup) {
      this.qmViewPopup.show(custCode);
    }
  }

  openSendForApprovalPopup(item: any) {
    if (this.sendForApprovalPopup) {
      this.sendForApprovalPopup.show(item.ProspectName || item.CustName || 'Prospect', item.ContractID || item.CUSTCD || item.LeadId || '', item.CUSTCD || '');
    }
  }

  openAddQmView(item: any) {
    this.selectedCustomerDataForQm = item;
    this.currentScreen = 'add-qm';
  }
  
  formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(+year, +month - 1, +day);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(',', '').toLowerCase();
  };

   getQuatationList() {
     this.isLoading=true;
     if (this.listSubscription) { this.listSubscription.unsubscribe(); }
    const payload = {
      "FilterJson": {
      "ReportId":'376',
      "FromDate": this.formatDate(this.commonService.globalFilters.startDate),
      "ToDate": this.formatDate(this.commonService.globalFilters.endDate),
      "BaseLocation": this.identityService.getBranchCode(),
      "Status": this.config.Status,
      "SearchName":this.commonService.globalFilters.searchText || "",
      "SearchCustCd":this.config.SearchCustCd,
      "QuotationType": this.config.QuotationType,
      "IsActive": this.config.IsActive,
      "PageNo": this.commonService.globalFilters.Page,
      "PageSize": this.commonService.globalFilters.PageSize
      }
    };
    this.listSubscription= this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        this.isLoading=false;
        if (response) {
          if (response.Table1) {
            this.cardList = response.Table1;
          }
          if (response.Table2 && response.Table2.length > 0) {
            this.totalItems = response.Table2[0].TotalRecords;
          }
          if (response.Table3) {
            this.quotationList = response.Table3;
          }
        }
      },
      error: (response: any) => {
        this.isLoading=false;
        this.sweetAlertService.error(response);
      },
    });
  }

    onSearchChange() {
    this.commonService.globalFilters.Page = 1;
    this.fetchSubject.next();
  }

  onQuotationTypeChange() {
    if (this.config.QuotationType === 'Prospect Wise') {
      this.config.IsActive = '';
    }else{
       this.config.Status = 'Customer Created';
       this.config.IsActive = 'Active';
    }
    if(this.config.QuotationType === 'Prospect Wise' && this.config.Status === 'Customer Created'){
      this.config.Status = 'Total Prospect';
    }
    this.onSearchChange();
  }

  getCardClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('total prospect')) return 'stat-teal';
    if (s.includes('prospect generated')) return 'stat-blue';
    if (s.includes('kyc generated')) return 'stat-amber';
    if (s.includes('customer created')) return 'stat-green';
    if (s.includes('send for approval')) return 'stat-purple';
    if (s.includes('rejected')) return 'stat-red';
    if (s.includes('customer code creation')) return 'stat-teal';
    return 'stat-blue';
  }

  getProspectStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('prospect generated')) return 'bg-blue';
    if (s.includes('kyc generated') || s.includes('quotation generated') || s.includes('rejected')) return 'bg-red';
    if (s.includes('approval')) return 'bg-amber';
    if (s.includes('Pending for Customer Code Creation') || s.includes('customer created')) return 'bg-green';
    return 'bg-grey';
  }

  getCardIcon(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('total prospect')) return 'fa fa-users';
    if (s.includes('prospect generated')) return 'fa fa-minus-circle';
    if (s.includes('kyc generated')) return 'fa fa-file-text-o';
    if (s.includes('customer created')) return 'fa fa-check-circle';
    if (s.includes('send for approval')) return 'fa fa-clock-o';
    if (s.includes('rejected')) return 'fa fa-exclamation-triangle';
    if (s.includes('customer code creation')) return 'fa fa-clock-o';
    return 'fa fa-file';
  }

  onCardClick(status: string) {
    if (this.config.Status !== status) {
      this.config.Status = status;

      if (status.toLowerCase() === 'customer created') {
        this.config.QuotationType = 'Customer Wise';
        if (!this.config.IsActive) {
          this.config.IsActive = 'Active';
        }
      } else {
        this.config.QuotationType = 'Prospect Wise';
        this.config.IsActive = '';
      }

      this.commonService.globalFilters.Page = 1;
      this.getQuatationList();
    }
  }

  onPageChange(event: any) {
    this.commonService.globalFilters.Page = event.page;
    this.getQuatationList();
  }

  getCustomerDetail(){
    this.quotationService.getCustomer().subscribe((res:any) => {
      this.customerData=res.data;
    })
  }
}
