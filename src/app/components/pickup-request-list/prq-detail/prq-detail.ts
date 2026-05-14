import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-prq-detail',
  imports: [CommonModule],
  templateUrl: './prq-detail.html',
  styleUrl: './prq-detail.scss',
})
export class PrqDetail {
  public modalRef!: BsModalRef;
  public modalService = inject(BsModalService);
  public PrqResponse: any = null;
  public isLoading: boolean = false;
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;

  showPopup(apiCall: () => any) {
    this.isLoading = true;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
    apiCall().subscribe({
      next: (response: any) => {
        const data = response?.data;
        if (data) {
          this.PrqResponse = data;
          this.isLoading = false;
        }
      },
      error: (_response: any) => {
        this.PrqResponse = null;
        this.isLoading = false;
        this.onClose();
      },
    });
  }

  onClose() {
    this.modalRef?.hide();
  }
}
