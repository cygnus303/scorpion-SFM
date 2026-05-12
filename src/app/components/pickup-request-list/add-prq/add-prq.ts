import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CommonService } from '../../../shared/services/common.service';
import { PrqService } from '../../../shared/services/prq-service';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, Observable, of, catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-add-prq',
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './add-prq.html',
  styleUrl: './add-prq.scss',
})
export class AddPrq {
  public modalRef!: BsModalRef;
  public PRQType: string = '';
  public emailData: any[] = [];
  public customerData: any[] = [];
  public customerLoading = false;
  public customerSearch$ = new Subject<string>();

  @ViewChild('Templatepod', { static: true }) Templatepod!: TemplateRef<any>;
  private modalService = inject(BsModalService);
  private fb = inject(FormBuilder);
  private prqService = inject(PrqService);
  private commonService = inject(CommonService);

  prqForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;

  constructor() {
  }



  initForm() {
    this.prqForm = this.fb.group({
      indentNo: [{ value: 'System Generated', disabled: true }],
      customerCode: [null, Validators.required],
      loadingDate: [new Date(), Validators.required],
      pickupAddress: ['', Validators.required],
      unloadingContactNo: ['', Validators.required],

      pickupPinCode: [null, Validators.required],
      email: [null, Validators.required],
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
    this.getEmailList();
    if (type) {
      this.PRQType = type;
      this.prqForm.patchValue({ serviceType: type });
    }
    this.modalRef = this.modalService.show(this.Templatepod, {
      backdrop: 'static',
      class: 'modal-lg modal-dialog-centered'
    });
  }

  onClose() {
    this.modalRef.hide();
  }

  getEmailList() {
    this.prqService.getEmailList().subscribe((res: any) => {
      this.emailData = res.data;
    });
  }

  onChangeCustomer(event: any) {
    const term = event.term;
    if (term && term.length >= 3) {
      this.prqService.getCustomerList(term).subscribe((res: any) => {
        this.customerData = res.data;
      });
    }
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
