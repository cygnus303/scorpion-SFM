import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddKycPopupComponent } from './add-kyc-popup/add-kyc-popup';
import { QmViewPopupComponent } from './qm-view-popup/qm-view-popup';
import { ExpenseGeneralService } from '../../shared/services/expense-general.service';
import { CommonService } from '../../shared/services/common.service';
import { IdentityService } from '../../shared/services/identity.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-quotation-qms',
  standalone: true,
  imports: [CommonModule, AddKycPopupComponent, QmViewPopupComponent],
  templateUrl: './quotation-qms.html',
  styleUrl: './quotation-qms.scss',
})
export class QuotationQMS {
  @ViewChild(AddKycPopupComponent) addKycPopup!: AddKycPopupComponent;
  @ViewChild(QmViewPopupComponent) qmViewPopup!: QmViewPopupComponent;

  constructor(
    private expenseGeneralService:ExpenseGeneralService,
    private commonService:CommonService,
    private sweetAlertService:SweetAlertService,
    private identityService:IdentityService
  ){}

  openKycPopup() {
    if (this.addKycPopup) {
      this.addKycPopup.show();
    }
  }

  openQmViewPopup() {
    if (this.qmViewPopup) {
      this.qmViewPopup.show();
    }
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
    const payload = {
      "FilterJson": {
        // "ReportId": "224",
        // "FromDate": this.formatDate(this.commonService.globalFilters.startDate),
        // "ToDate": this.formatDate(this.commonService.globalFilters.endDate),
        // "BaseLocation":this.identityService.getBranchCode(),
        // "UserName": this.identityService.getUserName(),
        // "SearchText":this.commonService.globalFilters.searchText || "",

      "ReportId":'376',
      "FromDate": this.formatDate(this.commonService.globalFilters.startDate),
      "ToDate": this.formatDate(this.commonService.globalFilters.endDate),
      "BaseLocation": this.identityService.getBranchCode(),
      "Status": "Total Prospect",
      "SearchName": "",
      "QuotationType": "Customer Wise",
      "IsActive": "",
      "PageNo": 1,
      "PageSize": 200
      }
    };
    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        if (response && response.Table1 && response.Table1.length > 0) {
          // const data = response.Table1;
          // this.PRQCard = data.sort((a: any, b: any) => a.ord - b.ord);
         }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
    });
  }
}
