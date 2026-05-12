import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-add-prq',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-prq.html',
  styleUrl: './add-prq.scss',
})
export class AddPrq {
  public modalRef!: BsModalRef;
  public PRQType:string='';
  @ViewChild('Templatepod', { static: true }) Templatepod!: TemplateRef<any>;
  private modalService = inject(BsModalService);
  private fb = inject(FormBuilder);

  prqForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;

 

  initForm() {
    this.prqForm = this.fb.group({
      indentNo: [{ value: 'System Generated', disabled: true }],
      customerCode: [null, Validators.required],
      loadingDate: [new Date(), Validators.required],
      pickupAddress: ['', Validators.required],
      unloadingContactNo: ['', Validators.required],

      pickupPinCode: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      destPinCode: [null, Validators.required],
      deliveryAddress: ['', Validators.required],
      approxWeight: [0, Validators.required],

      pickupBranch: [{ value: '', disabled: true }],
      customerName: [{ value: '', disabled: true }],
      destBranch: [{ value: '', disabled: true }],
      noOfPackages: ['', Validators.required],
      shipmentNo: [''],

      fromCity: [{ value: '', disabled: true }],
      kam: [{ value: '', disabled: true }],
      serviceType: ['LTL', Validators.required],
      loadingContactNo: ['', Validators.required],
      remarks: ['']
    });
  }

  showPopup(type?: string) {
     this.initForm();
    if (type) {
      this.PRQType=type;
      console.log(this.PRQType)
    }
    this.modalRef = this.modalService.show(this.Templatepod, {
      backdrop: 'static'
    });
  }

  onClose() {
    this.modalRef.hide();
  }

  onSubmit() {
    if (this.prqForm.valid) {
      console.log('Form Data:', this.prqForm.getRawValue());
      this.onClose();
    } else {
      this.prqForm.markAllAsTouched();
    }
  }
}
