import { Component, ViewChild, TemplateRef, inject, EventEmitter, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { Quotation } from '../../../shared/services/quotation';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-kyc-popup',
  standalone: true,
  imports: [CommonModule, ModalModule, NgSelectModule, ReactiveFormsModule],
  providers: [BsModalService],
  templateUrl: './add-kyc-popup.html',
  styleUrl: './add-kyc-popup.scss'
})
export class AddKycPopupComponent {
  public modalRef!: BsModalRef;
  public businessData: any;
  public ownerData: any;
  public pincodeData: any;
  public industryData: any;
  public stateData: any;
  public cityData: any;

  @Output() onSuccess = new EventEmitter<void>();

  private modalService = inject(BsModalService);
  private toasterService = inject(ToastrService);
  public kycForm!: FormGroup;
  private fb = inject(FormBuilder);

  @ViewChild('kycTemplate') kycTemplate!: TemplateRef<any>;

  constructor(private quotationService: Quotation) { 
    this.initForm();
  }

  initForm() {
    this.kycForm = this.fb.group({
      custcd: [''],
      custnm: ['', Validators.required],
      company_Name: ['', Validators.required],
      decision_Name: ['', Validators.required],
      decision_Designation: ['', Validators.required],
      custAddress: ['', Validators.required],
      city: [null, Validators.required],
      cust_State: [null, Validators.required],
      pincode: [null, Validators.required],
      telno: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      mobileno: [''],
      decision_Mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      emailids: ['', [Validators.required, Validators.email]],
      businessType: [null, Validators.required],
      gstno: ['', [Validators.required, Validators.pattern('^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')]],
      industry: [null, Validators.required],
      turnover: ['', [Validators.required, Validators.min(10000), Validators.pattern('^[0-9]*$')]],
      businessname: ['', Validators.required],
      address_Bill: ['', Validators.required],
      pincode_Bill: [null, Validators.required],
      city_Bill: [null, Validators.required],
      prospectStatus: [0],
      action: [''],
      bill_State: [null, Validators.required],
      isKYCdone: [''],
      pan_no: [''],
      ownership: [null, Validators.required],
      isBillingSame: [false]
    });
  }

  show(custCode?: string) {
    this.kycForm.reset({ custcd: '', turnover: '', prospectStatus: 0, isBillingSame: false });
    this.modalRef = this.modalService.show(this.kycTemplate, { class: 'modal-xl modal-dialog-centered modal-dialog-scrollable', backdrop: 'static' });
    
    if (custCode) {
      this.quotationService.getKYCDetail(custCode).subscribe((res: any) => {
        if (res && res.success && res.data) {
          const data = res.data;
          this.kycForm.patchValue({
            custcd: data.custcd || '',
            custnm: data.custnm || '',
            company_Name: data.company_Name || '',
            decision_Name: data.decision_Name || '',
            decision_Designation: data.decision_Designation || '',
            custAddress: data.custAddress || '',
            city: data.city || null,
            cust_State: data.cust_State || null,
            pincode: data.pincode || null,
            telno: data.telno || data.mobileno || '',
            mobileno: data.mobileno || '',
            decision_Mobile: data.decision_Mobile || '',
            emailids: data.emailids || '',
            businessType: data.businessType || null,
            gstno: data.gstno || '',
            industry: data.industry || null,
            turnover: data.turnover || '',
            businessname: data.businessname || '',
            address_Bill: data.address_Bill || '',
            pincode_Bill: data.pincode_Bill || null,
            city_Bill: data.city_Bill || null,
            prospectStatus: data.prospectStatus || 0,
            action: data.action || '',
            bill_State: data.bill_State || null,
            isKYCdone: data.isKYCdone || '',
            pan_no: data.pan_no || '',
            ownership: data.ownership || null,
            isBillingSame: false
          });
        }
      });
    }

    this.getBusinessData();
    this.getOwnershipData();
    this.getIndustryData();
    this.getStateDetail();
    this.getCityDetail();
    this.getPincodeDetail();
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

  getPincodeDetail(){
     this.quotationService.getPincode().subscribe((res:any) => {
      this.pincodeData = res.data;
    })
  }

  onGstChange() {
    const gstNo = this.kycForm.get('gstno')?.value;
    if (gstNo && gstNo.length === 15 && this.kycForm.get('gstno')?.valid) {
      this.quotationService.getGSTDetail(gstNo).subscribe((res: any) => {
        if (res && res.success && res.data) {
          const data = res.data;
          this.kycForm.patchValue({
            company_Name: data.lgnm || '',
            custnm: data.tradeNam || '',
            custAddress: data.address || '',
            city: data.dst || '',
            cust_State: data.stcd || '',
            pincode: data.pncd || '',
            decision_Name: data.location || ''
          });
          this.toasterService.success('GST details fetched successfully.');
        } else if (res && !res.success) {
          this.toasterService.error(res.message || 'Failed to fetch GST details.');
        }
      });
    }
  }

  onBillingSameChange(event: any) {
    const isChecked = event.target.checked;
    if (isChecked) {
      this.kycForm.patchValue({
        businessname: this.kycForm.get('company_Name')?.value || this.kycForm.get('custnm')?.value,
        // decision_Mobile: this.kycForm.get('telno')?.value,
        address_Bill: this.kycForm.get('custAddress')?.value,
        bill_State: this.kycForm.get('cust_State')?.value,
        city_Bill: this.kycForm.get('city')?.value,
        pincode_Bill: this.kycForm.get('pincode')?.value,
      });
    } else {
      this.kycForm.patchValue({
        businessname: '',
        decision_Mobile: '',
        address_Bill: '',
        bill_State: null,
        city_Bill: null,
        pincode_Bill: null,
      });
    }
  }

  onSubmit(){
    if (this.kycForm.invalid) {
      this.kycForm.markAllAsTouched();
      return;
    }
    const payload = { ...this.kycForm.value };
    delete payload.isBillingSame;
    
    this.quotationService.submitKYC(payload).subscribe({
      next: (res: any) => {
        if(res && res.success){
          this.toasterService.success(res.message || 'KYC details submitted successfully.');
          this.onSuccess.emit();
          this.closePopup();
        } else {
          this.toasterService.error(res?.message || 'Failed to submit KYC details.');
        }
      },
      error: (err: any) => {
        if (err.error && err.error.errors) {
          const errorMessages = Object.values(err.error.errors).flat().join(', ');
          this.toasterService.error(errorMessages || 'Validation failed.');
        } else if (err.error && err.error.message) {
          this.toasterService.error(err.error.message);
        } else {
          this.toasterService.error(err.message || 'Failed to submit KYC details.');
        }
      }
    });
  }
}
