import { Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalService, BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { AppointmentDeliveryService } from '../../../shared/services/appointment-delivery.service';

@Component({
  selector: 'app-view-appointment',
  standalone: true,
  imports: [CommonModule, ModalModule],
  templateUrl: './view-appointment.html',
  styleUrl: './view-appointment.scss'
})
export class ViewAppointment {
  @ViewChild('viewModal', { static: true }) viewModal!: TemplateRef<any>;
  @ViewChild('historyModal', { static: true }) historyModal!: TemplateRef<any>;

  modalRef?: BsModalRef;
  historyModalRef?: BsModalRef;
  private modalService = inject(BsModalService);
  private appointmentService = inject(AppointmentDeliveryService);

  item: any = null;
  activeType: string = 'APMT';
  isLoading: boolean = false;
  listData:any;

  formatDate(d: string): string {
    if (!d || (d.charAt(2) !== '-' && d.charAt(2) !== '/')) return d || '-';
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.substring(0, 2)} ${m[+d.substring(3, 5) - 1]} ${d.substring(6, 10)}${d.substring(10)}`;
  }

  openModal(type: string, data: any) {
    this.activeType = type;
    this.item = null;
    this.isLoading = true;
    this.listData=data

    this.modalRef = this.modalService.show(this.viewModal, {
      class: 'modal-lg modal-dialog-centered',
      backdrop: 'static'
    });

    const id = data?.appointmentNo || data?.csdNo || data?.msdNo || data?.id || '';

    const payload = {
      type: this.activeType,
      id: id
    };

    this.appointmentService.getDeliveryAppointmentDetail(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.success && res.data) {
          this.item = res.data;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error fetching details', err);
      }
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  openHistoryModal() {
    this.historyModalRef = this.modalService.show(this.historyModal, {
      class: 'modal-md modal-dialog-centered',
      backdrop: 'static'
    });
  }

  closeHistoryModal() {
    if (this.historyModalRef) {
      this.historyModalRef.hide();
    }
  }

  getAppointmentDate(dateTimeStr: string): string {
    if (!dateTimeStr) return '-';
    const parts = dateTimeStr.split(' ');
    return parts[0] || '-';
  }

  getAppointmentTime(dateTimeStr: string): string {
    if (!dateTimeStr) return '-';
    const parts = dateTimeStr.split(' ');
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
    return '-';
  }
}
