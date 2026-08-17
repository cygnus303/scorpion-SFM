import { Component, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { Quotation } from '../../../shared/services/quotation';

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
  public QMData:any;
  public QMCharges:any[]=[];
  private modalService = inject(BsModalService);
  @ViewChild('qmViewTemplate') qmViewTemplate!: TemplateRef<any>;

  constructor(
    private quotationService:Quotation
  ){}

  show(custCode:string) {
    this.getViewDetail(custCode)
    this.modalRef = this.modalService.show(this.qmViewTemplate, { class: 'modal-xl qm-view-modal modal-dialog-centered modal-dialog-scrollable', backdrop: 'static' });
  }

  closePopup() {
    this.modalRef?.hide();
  }

  getViewDetail(custCode:string){

    this.quotationService.getView(custCode).subscribe({
      next:(response:any)=>{
        this.QMData = response.header;
        this.QMCharges = response.otherCharges;
      },
      error:(error:any)=>{
        console.error(error);
      }
    })

  }
}
