import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-expense-detail',
  imports: [CommonModule],
  templateUrl: './expense-detail.html',
  styleUrl: './expense-detail.scss',
})
export class ExpenseDetail {
  public modalRef!: BsModalRef;
  public docModalRef!: BsModalRef;
  public modalService = inject(BsModalService);
  public expenseResponse: any = null;
  public isLoading: boolean = false;

  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;
  onClose() {
    this.modalRef?.hide();
    this.docModalRef?.hide();
  }

  showPopup(apiCall: () => any) {
    this.isLoading = true;
    this.expenseResponse = null;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
    apiCall().subscribe({
      next: (response: any) => {
        const data = response?.data;
        if (data) {
          this.isLoading = false;
          this.expenseResponse = data;
        }
      },
      error: (response: any) => {
        this.isLoading = false;
        this.expenseResponse = null;
        this.onClose();
      },
    });
  }

  openPOD(template: TemplateRef<any>) {
    this.docModalRef = this.modalService.show(template, { class: 'modal-md modal-dialog-centered' });
  }
}
