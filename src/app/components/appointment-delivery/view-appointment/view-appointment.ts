import { Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalService, BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { AppointmentDeliveryService } from '../../../shared/services/appointment-delivery.service';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';

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
  public expenseGeneralService=inject(ExpenseGeneralService)

  item: any = null;
  activeType: string = 'APMT';
  isLoading: boolean = false;
  listData:any;
  rescheduleHistory: any[] = [];
  isHistoryLoading: boolean = false;

  formatDate(d: string): string {
    if (!d || (d.charAt(2) !== '-' && d.charAt(2) !== '/')) return d || '-';
    return `${d.substring(0, 2)}/${d.substring(3, 5)}/${d.substring(6, 10)}${d.substring(10)}`;
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
    this.rescheduleHistory = [];
    if (this.activeType === 'APMT' && this.item?.appointmentNo) {
      this.isHistoryLoading = true;
      const payload = {
        "FilterJson": {
          "ReportId": "387",
          "AppointmentNo": this.item.appointmentNo
        }
      };
      this.expenseGeneralService.getDynamicData(payload).subscribe({
        next: (res: any) => {
          this.isHistoryLoading = false;
          if (res && res.Table1) {
            this.rescheduleHistory = res.Table1;
          }
        },
        error: (err: any) => {
          this.isHistoryLoading = false;
          console.error('Error fetching history', err);
        }
      });
    }

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
