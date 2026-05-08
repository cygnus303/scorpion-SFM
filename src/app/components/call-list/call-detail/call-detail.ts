import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-call-detail',
  imports: [CommonModule],
  templateUrl: './call-detail.html',
  styleUrl: './call-detail.scss',
})
export class CallDetail {
  public modalRef!: BsModalRef;
  public modalService = inject(BsModalService);
  public isLoading:boolean=false;
  public callResponse:any;
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;

  showPopup(apiCall: () => any) {
    this.isLoading = true;
    this.callResponse = null;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
    apiCall().subscribe({
      next: (response: any) => {
        const data = response?.data;
        if (data) {
          this.isLoading = false;
          this.callResponse = data;
        }
      },
      error: (response: any) => {
        this.isLoading = false;
        this.callResponse = null;
        this.onClose();
      },
    });
  }
  onClose() {
    this.modalRef?.hide();
  }
}
