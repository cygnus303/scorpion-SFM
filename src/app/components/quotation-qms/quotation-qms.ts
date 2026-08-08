import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddKycPopupComponent } from './add-kyc-popup/add-kyc-popup';
import { QmViewPopupComponent } from './qm-view-popup/qm-view-popup';

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
}
