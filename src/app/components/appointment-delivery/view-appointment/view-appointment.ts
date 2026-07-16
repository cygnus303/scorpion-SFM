import { Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalService, BsModalRef, ModalModule } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-view-appointment',
  standalone: true,
  imports: [CommonModule, ModalModule],
  templateUrl: './view-appointment.html',
  styleUrl: './view-appointment.scss'
})
export class ViewAppointment {
  @ViewChild('viewModal', { static: true }) viewModal!: TemplateRef<any>;

  modalRef?: BsModalRef;
  private modalService = inject(BsModalService);

  item: any = null;

  openModal(itemData: any) {
    this.item = itemData;
    this.modalRef = this.modalService.show(this.viewModal, {
      class: 'modal-lg modal-dialog-centered',
      backdrop: 'static'
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  getAppointmentDate(dateTimeStr: string): string {
    if (!dateTimeStr) return '22/06/2026';
    const parts = dateTimeStr.split(' ');
    return parts[0] || '22/06/2026';
  }

  getAppointmentTime(dateTimeStr: string): string {
    if (!dateTimeStr) return '10:00 AM — 11:00 AM';
    const parts = dateTimeStr.split(' ');
    if (parts.length >= 2) {
      return parts.slice(1).join(' ').replace(/\s*[–—-]\s*/g, ' — ') || '10:00 AM — 11:00 AM';
    }
    return '10:00 AM — 11:00 AM';
  }
}
