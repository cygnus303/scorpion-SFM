import { Component, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-qm-view-popup',
  standalone: true,
  imports: [CommonModule, ModalModule],
  providers: [BsModalService],
  templateUrl: './qm-view-popup.html',
  styleUrl: './qm-view-popup.scss'
})
export class QmViewPopupComponent {
  public modalRef!: BsModalRef;
  private modalService = inject(BsModalService);
  
  @ViewChild('qmViewTemplate') qmViewTemplate!: TemplateRef<any>;

  show() {
    this.modalRef = this.modalService.show(this.qmViewTemplate, { class: 'modal-xl qm-view-modal modal-dialog-centered modal-dialog-scrollable', backdrop: 'static' });
  }

  closePopup() {
    this.modalRef?.hide();
  }
}
