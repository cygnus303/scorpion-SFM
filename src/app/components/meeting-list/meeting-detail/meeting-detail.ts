import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CommonModule } from '@angular/common';

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
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;

  showPopup(meeting?: any) {
    this.meetingResponse = meeting;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
  }

  patchData(data: any) {
    this.meetingResponse = data;
  }

  onClose() {
    this.modalRef?.hide();
  }
}
