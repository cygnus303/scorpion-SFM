import { Component, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { Quotation } from '../../../shared/services/quotation';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-add-kyc-popup',
  standalone: true,
  imports: [CommonModule, ModalModule, NgSelectModule],
  providers: [BsModalService],
  templateUrl: './add-kyc-popup.html',
  styleUrl: './add-kyc-popup.scss'
})
export class AddKycPopupComponent {
  public modalRef!: BsModalRef;
  public businessData: any;
  public ownerData: any;
  public industryData: any;
  public stateData: any;
  public cityData: any;

  private modalService = inject(BsModalService);

  @ViewChild('kycTemplate') kycTemplate!: TemplateRef<any>;

  constructor(private quotationService: Quotation) { }

  show() {
    this.modalRef = this.modalService.show(this.kycTemplate, { class: 'modal-xl modal-dialog-centered modal-dialog-scrollable', backdrop: 'static' });
    this.getBusinessData();
    this.getOwnershipData();
    this.getIndustryData();
    this.getStateDetail();
    this.getCityDetail();
  }

  getBusinessData() {
    this.quotationService.getGeneralMasterData('BUSINESSCAT').subscribe((res: any) => {
      this.businessData = res.data;
    });
  }

   getOwnershipData() {
    this.quotationService.getGeneralMasterData('CONRSHP').subscribe((res: any) => {
      this.ownerData = res.data;
    });
  }

  getIndustryData(){
     this.quotationService.getGeneralMasterData('IND').subscribe((res: any) => {
      this.industryData = res.data;
    });
  }

  closePopup() {
    this.modalRef?.hide();
  }

  getStateDetail(){
     this.quotationService.getState().subscribe((res: any) => {
      this.stateData = res.data;
    });
  }

  getCityDetail(){
    this.quotationService.getCity().subscribe((res:any) => {
      this.cityData = res.data;
    })
  }
}
