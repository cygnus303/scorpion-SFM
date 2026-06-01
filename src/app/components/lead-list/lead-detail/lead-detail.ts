import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'app-lead-detail',
  imports: [CommonModule],
  templateUrl: './lead-detail.html',
  styleUrl: './lead-detail.scss',
})
export class LeadDetail {
  public modalRef!: BsModalRef;
  public modalService = inject(BsModalService);
  public leadResponse: any = null;
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
          this.leadResponse = data;
          this.isLoading = false;
        }
      },
      error: (_response: any) => {
        this.leadResponse = null;
        this.isLoading = false;
        this.onClose();
      },
    });
  }

  onClose() {
    this.modalRef?.hide();
  }
}
