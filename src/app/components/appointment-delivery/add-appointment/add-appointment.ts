import { Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsModalService, BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-add-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalModule, BsDatepickerModule],
  templateUrl: './add-appointment.html',
  styleUrl: './add-appointment.scss'
})
export class AddAppointment {
  @ViewChild('addModal', { static: true }) addModal!: TemplateRef<any>;

  modalRef?: BsModalRef;
  private modalService = inject(BsModalService);

  entryType: 'Appointment' | 'CSD' | 'Mall' = 'Appointment';
  docketNo: string = '';
  orgDest: string = '';
  currentStatus: string = '';
  docketDate: string = '';
  edd: string = '';
  consigneeName: string = '';
  consigneeContact: string = '';
  consigneeAddress: string = '';
  consigneeEmail: string = '';
  appointmentDate: string = '';
  personName: string = '';
  contactNo: string = '';
  timeFrom: string = '';
  timeTo: string = '';
  remarks: string = '';

  openModal(defaultTab: 'Appointment' | 'CSD' | 'Mall' = 'Appointment') {
    this.entryType = defaultTab;
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
}
