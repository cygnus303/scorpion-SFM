import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { CommonModule } from '@angular/common';
import { LrView } from '../../lr-view/lr-view';

@Component({
  selector: 'app-docket-history',
  imports: [LrView, CommonModule],
  templateUrl: './docket-history.html',
  styleUrl: './docket-history.scss',
})
export class DocketHistoryComponent {
 @ViewChild('docketHistoryModal') docketHistoryModalTemplate!: TemplateRef<any>;
  @ViewChild('lrViewComponent') lrViewComponent!: LrView;
  
  public modalRef?: BsModalRef;
  public indentNo: string = '';
  public isLoading: boolean = false;
  public docketHistoryList: any[] = [];

  constructor(
    private modalService: BsModalService,
      private expenseGeneralService: ExpenseGeneralService,
    private sweetAlertService: SweetAlertService
  ) {}

  showPopup(indentNo: string) {
    this.indentNo = indentNo;
    this.docketHistoryList = [];
    this.isLoading = true;
    const config: ModalOptions = {
      class: 'modal-xl modal-dialog-centered hcc-view-modal-custom', // default opens at top center
      backdrop: 'static'
    };
    
    this.modalRef = this.modalService.show(this.docketHistoryModalTemplate, config);

    const payload = {
      "FilterJson": {
        "ReportId": "385",
        "IndentNo": indentNo
      }
    };

    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.Table1) {
          this.docketHistoryList = response.Table1;
        } else {
          this.docketHistoryList = [];
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.sweetAlertService.error(error?.error?.message || 'Failed to fetch docket history');
      }
    });
  }

  closeModal() {
    this.modalRef?.hide();
    this.indentNo = '';
    this.docketHistoryList = [];
  }

  openLrView(docketNo: string) {
    if (docketNo) {
      this.lrViewComponent.showPopup(docketNo);
    }
  }
}
