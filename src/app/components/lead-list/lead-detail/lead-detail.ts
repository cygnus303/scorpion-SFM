import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

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
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;

  showPopup(lead: any) {
    this.leadResponse = lead;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
  }
}
