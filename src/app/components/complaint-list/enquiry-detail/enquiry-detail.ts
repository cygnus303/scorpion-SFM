import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { DocDataDetail } from '../../../shared/models/complaint.model';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'app-enquiry-detail',
  imports: [CommonModule],
  templateUrl: './enquiry-detail.html',
  styleUrl: './enquiry-detail.scss',
})
export class EnquiryDetail {
    public enquiryResponse:any;
    public isLoading: boolean = false;
    public modalRef!: BsModalRef;
    public docketNoList?: DocDataDetail;
    public modalService = inject(BsModalService);
    public complaintService = inject(ComplaintService);
    public commonService = inject(CommonService);
    @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;
  showPopupWithLoading(apiCall: () => any) {
    this.isLoading = true;
    this.enquiryResponse = null;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
    apiCall().subscribe({
      next: (response: any) => {
        const data = response?.data;
        if (data) {
          this.isLoading = false;
          this.enquiryResponse = data;
           this.onDocketNo(data?.documentNo)
        }
      },
      error: (response: any) => {
        this.isLoading = false;
        this.enquiryResponse = null;
        this.onClose();
      },
    });
  }

   onClose() {
    if (this.modalRef) {
      this.modalRef.hide();
    }
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
}
