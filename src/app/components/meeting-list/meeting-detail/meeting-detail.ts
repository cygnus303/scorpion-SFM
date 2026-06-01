import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'app-meeting-detail',
  imports: [CommonModule],
  templateUrl: './meeting-detail.html',
  styleUrl: './meeting-detail.scss',
})
export class MeetingDetail {
  public modalRef!: BsModalRef;
  public modalService = inject(BsModalService);
  public meetingResponse: any = null;
  public isLoading: boolean = false;
  public commonService = inject(CommonService);
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;

  showPopup(apiCall: () => any) {
    this.isLoading = true;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
    apiCall().subscribe({
      next: (response: any) => {
        const data = response?.data;
        if (data) {
          this.meetingResponse = data;
          this.isLoading = false;
        }
      },
      error: (_response: any) => {
        this.meetingResponse = null;
        this.isLoading = false;
        this.onClose();
      },
    });
  }

  patchData(data: any) {
    this.meetingResponse = data;
  }

  onClose() {
    this.modalRef?.hide();
  }
}
