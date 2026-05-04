import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'expense-generalmaster-detail',
  imports: [CommonModule],
  templateUrl: './expense-generalmaster-detail.html',
  styleUrl: './expense-generalmaster-detail.scss',
})
export class ExpenseGeneralmasterDetail {
  public modalRef!: BsModalRef;
  public modalService = inject(BsModalService);
  public expenseResponse: any = null;
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;

  showPopup(data: any) {
    this.expenseResponse = data;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
  }

  onClose() {
    this.modalRef?.hide();
  }
}
