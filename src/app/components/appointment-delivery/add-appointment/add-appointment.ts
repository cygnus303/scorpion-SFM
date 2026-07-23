import { Component, TemplateRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalService, BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { ComplaintService } from '../../../shared/services/complaint.service';

@Component({
  selector: 'app-add-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalModule, BsDatepickerModule],
  templateUrl: './add-appointment.html',
  styleUrl: './add-appointment.scss'
})
export class AddAppointment implements OnInit {
  @ViewChild('addModal', { static: true }) addModal!: TemplateRef<any>;

  modalRef?: BsModalRef;
  private modalService = inject(BsModalService);
  private complaintService = inject(ComplaintService);
  appointmentForm = new FormGroup({
    entryType: new FormControl('APMT'),
    docketNo: new FormControl('', [Validators.required]),
    orgDest: new FormControl(''),
    currentStatus: new FormControl(''),
    docketDate: new FormControl(''),
    edd: new FormControl(''),
    consigneeName: new FormControl(''),
    consigneeContact: new FormControl(''),
    consigneeAddress: new FormControl(''),
    consigneeEmail: new FormControl(''),
    appointmentDate: new FormControl(''),
    personName: new FormControl(''),
    contactNo: new FormControl(''),
    timeFrom: new FormControl(''),
    timeTo: new FormControl(''),
    remarks: new FormControl('')
  });

  get entryType() {
    return this.appointmentForm.get('entryType')?.value || 'APMT';
  }

  ngOnInit() {
    this.updateValidations(this.entryType);
    
    this.appointmentForm.get('entryType')?.valueChanges.subscribe(val => {
      this.updateValidations(val);
    });
  }

  updateValidations(type: string | null | undefined) {
    const apmtFields = ['appointmentDate', 'personName', 'contactNo', 'timeFrom', 'timeTo', 'remarks'];
    if (type === 'APMT') {
      apmtFields.forEach(field => {
        this.appointmentForm.get(field)?.setValidators([Validators.required]);
        this.appointmentForm.get(field)?.updateValueAndValidity();
      });
    } else {
      apmtFields.forEach(field => {
        this.appointmentForm.get(field)?.clearValidators();
        this.appointmentForm.get(field)?.updateValueAndValidity();
      });
    }
  }

  openModal(defaultTab: 'APMT' | 'CSD' | 'MSD' = 'APMT') {
    this.appointmentForm.patchValue({ entryType: defaultTab });
    this.modalRef = this.modalService.show(this.addModal, {
      class: 'modal-lg modal-dialog-centered',
      backdrop: 'static'
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  submitForm() {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }
    // TODO: implement actual save API call here
    console.log('Form Submitted successfully:', this.appointmentForm.value);
  }

  fetchDocketDetails() {
    const docketNo = this.appointmentForm.get('docketNo')?.value;
    if (!docketNo) return;

    this.complaintService.getDocDataDetail(docketNo).subscribe({
      next: (res) => {
        if (res && res.data) {
          const origin = res.data.origin || '';
          const dest = res.data.destination || '';
          const orgDest = origin && dest ? `${origin} / ${dest}` : (origin || dest || '');
          
          this.appointmentForm.patchValue({
            orgDest: orgDest,
            currentStatus: res.data.currentStatus || '',
            docketDate: res.data.documentDate || '',
            edd: res.data.edd || '',
            consigneeName: res.data.customerName || '',
            consigneeEmail: res.data.customerEmail || ''
          });
        }
      },
      error: (err) => {
        console.error('Error fetching docket details', err);
      }
    });
  }
}
