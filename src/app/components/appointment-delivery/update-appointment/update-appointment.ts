import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
  activeType: string = '';
  appointmentData: any = null;

  updateForm = new FormGroup({
    docketNo: new FormControl(''),
    docketDate: new FormControl(''),
    edd: new FormControl(''),
    docketStatus: new FormControl(''),
    deliveryDate: new FormControl<any>('', Validators.required),
    timeFrom: new FormControl('', Validators.required),
    timeTo: new FormControl('', Validators.required)
  });

  openModal(type: string, data: any) {
    this.activeType = type;
    this.appointmentData = data;
    this.updateForm.reset();

    let timeFrom = '';
    let timeTo = '';
    if (data?.appointmentTime) {
      const timeParts = data.appointmentTime.split(' To ');
      if (timeParts.length === 2) {
        timeFrom = timeParts[0].trim();
        timeTo = timeParts[1].trim();
      }
    }

    let rawDeliveryDate = data?.appointmentDT || data?.csdDate || data?.msdDate || '';
    let parsedDeliveryDate = rawDeliveryDate ? new Date(rawDeliveryDate.split('-').reverse().join('-')) : '';

    // Map existing data to form
    this.updateForm.patchValue({
      docketNo: data?.dockno || '',
      docketDate: data?.cNoteDate || '-',
      edd: data?.edd || '-',
      docketStatus: data?.currentStatus || '-',
      
      deliveryDate: parsedDeliveryDate,
      timeFrom: timeFrom,
      timeTo: timeTo
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
