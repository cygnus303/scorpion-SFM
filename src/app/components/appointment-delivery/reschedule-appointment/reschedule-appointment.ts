import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalDirective, ModalModule } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-reschedule-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalModule],
  templateUrl: './reschedule-appointment.html',
  styleUrls: ['./reschedule-appointment.scss']
})
export class RescheduleAppointment {
  @ViewChild('rescheduleModal') rescheduleModal!: ModalDirective;
  @Output() onUpdate = new EventEmitter<any>();

  rescheduleForm: FormGroup;
  activeType: string = 'APMT';
  appointmentData: any = null;

  constructor(private fb: FormBuilder) {
    this.rescheduleForm = this.fb.group({
      docketNo: [{ value: '', disabled: true }],
      docketDate: [{ value: '', disabled: true }],
      edd: [{ value: '', disabled: true }],
      docketStatus: [{ value: '', disabled: true }],

      appointmentDate: ['', Validators.required],
      timeFrom: ['', Validators.required],
      timeTo: ['', Validators.required],
      personName: ['', Validators.required],
      contactNo: ['', Validators.required],
      appointmentRemarks: ['']
    });
  }

  openModal(type: string, data: any) {
    this.activeType = type;
    this.appointmentData = data;
    this.rescheduleForm.reset();

    // Map existing data to form
    this.rescheduleForm.patchValue({
      docketNo: data?.dockno || '',
      docketDate: data?.docketDate || '',
      edd: data?.edd || '',
      docketStatus: data?.docketStatus || 'In Transit',
      
      appointmentDate: data?.appointmentDT || data?.csdDate || data?.msdDate || '',
      personName: data?.custnm || '',
      contactNo: data?.contactNo || ''
    });

    this.rescheduleModal.show();
  }

  closeModal() {
    this.rescheduleModal.hide();
  }

  onSubmit() {
    if (this.rescheduleForm.valid) {
      this.onUpdate.emit({
        type: this.activeType,
        originalData: this.appointmentData,
        formData: this.rescheduleForm.getRawValue()
      });
      this.closeModal();
    } else {
      this.rescheduleForm.markAllAsTouched();
    }
  }
}
