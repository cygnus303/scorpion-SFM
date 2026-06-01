import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { DocDataDetail, EscalatedHistory, UpdateHistory } from '../../../shared/models/complaint.model';
import { CommonService } from '../../../shared/services/common.service';
// import { Modal } from 'bootstrap'; // removed – using ngx-bootstrap modal service

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './complaint-detail.html',
  styleUrl: './complaint-detail.scss',
})
export class ComplaintDetail {
  public modalRef!: BsModalRef;
  public historyModalRef!: BsModalRef;
  public escalationModalRef!: BsModalRef;
  updateHistoryList: UpdateHistory[] = [];
  escalatedHistory: EscalatedHistory[] = [];
  public complaintResponse: any = null;
  public docketNoList?: DocDataDetail;
  public isLoading: boolean = false;
  public modalService = inject(BsModalService);
  public complaintService = inject(ComplaintService);
  public commonService = inject(CommonService);
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;
  @ViewChild('historyModalTemplate') historyModalTemplate!: TemplateRef<any>;
  @ViewChild('escalationModalTemplate') escalationModalTemplate!: TemplateRef<any>;

  showPopupWithLoading(apiCall: () => any) {
    this.isLoading = true;
    this.complaintResponse = null;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
    apiCall().subscribe({
      next: (response: any) => {
        const data = response?.data;
        if (data) {
          this.isLoading = false;
          this.complaintResponse = data;
          this.updateHistory(data?.complaintID)
          this.onDocketNo(data?.documentNo)
        }
      },
      error: (response: any) => {
        this.isLoading = false;
        this.complaintResponse = null;
        this.onClose();
      },
    });
  }


  onClose() {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  updateHistory(complaintID: any) {
    this.complaintService.getupdateHistory(complaintID).subscribe((res: any) => {
      this.updateHistoryList = res.data;
    });
    this.complaintService.getEscalatedHistory(complaintID).subscribe((res: any) => {
      this.escalatedHistory = res.data;
    });
  }

  onDocketNo(docketNo: any) {
    this.complaintService.getDocDataDetail(docketNo).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.docketNoList = response.data
        }
      }
    });
  }

  openHistoryPopup(): void {
    this.historyModalRef = this.modalService.show(this.historyModalTemplate, {
      class: 'modal-xl modal-dialog-centered history-modal',
      backdrop: true,
      ignoreBackdropClick: false
    });
  }


  openEscalation(): void {
    this.escalationModalRef = this.modalService.show(this.escalationModalTemplate, {
      class: 'modal-xl modal-dialog-centered history-modal',
      backdrop: true,
      ignoreBackdropClick: false
    });
  }

}