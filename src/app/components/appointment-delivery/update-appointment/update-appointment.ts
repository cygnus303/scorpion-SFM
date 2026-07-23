import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalDirective, ModalModule } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-update-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalModule],
  templateUrl: './update-appointment.html',
  styleUrls: ['./update-appointment.scss']
})
export class UpdateAppointment {
  @ViewChild('updateModal') updateModal!: ModalDirective;
  @Output() onUpdate = new EventEmitter<any>();

  updateForm: FormGroup;
  activeType: string = 'APMT';
  appointmentData: any = null;

  constructor(private fb: FormBuilder) {
    this.updateForm = this.fb.group({
      docketNo: [{ value: '', disabled: true }],
      docketDate: [{ value: '', disabled: true }],
      edd: [{ value: '', disabled: true }],
      docketStatus: [{ value: '', disabled: true }],

      deliveryDate: ['', Validators.required],
      timeFrom: ['', Validators.required],
      timeTo: ['', Validators.required]
    });
  }

  openModal(type: string, data: any) {
    this.activeType = type;
    this.appointmentData = data;
    this.updateForm.reset();

    // Map existing data to form
    this.updateForm.patchValue({
      docketNo: data?.dockno || '',
      docketDate: data?.docketDate || '-',
      edd: data?.edd || '-',
      docketStatus: data?.docketStatus || '-',
      
      deliveryDate: data?.csdDate || data?.msdDate || '',
      timeFrom: data?.timeFrom || '',
      timeTo: data?.timeTo || ''
    });

    this.updateModal.show();
  }

  closeModal() {
    this.updateModal.hide();
  }

  onSubmit() {
    if (this.updateForm.valid) {
      this.onUpdate.emit({
        type: this.activeType,
        originalData: this.appointmentData,
        formData: this.updateForm.getRawValue()
      });
      this.closeModal();
    } else {
      this.updateForm.markAllAsTouched();
    }
  }
}
