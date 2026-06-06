import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-csat-survey-view',
  imports: [CommonModule],
  templateUrl: './csat-survey-view.html',
  styleUrl: './csat-survey-view.scss',
})
export class CsatSurveyView {
  public modalRef!: BsModalRef;
  public modalService = inject(BsModalService);
  public sweetAlertService = inject(SweetAlertService);
  public isLoading: boolean = false;
  public surveyResponse: any;

  public expenseResponse: any = null;
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;

  showPopup(apiCall: () => any) {
    this.isLoading = true;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
    apiCall().subscribe({
      next: (response: any) => {
        const data = response?.data[0];
        if (data) {
          this.surveyResponse = data;
          this.isLoading = false;
        }
      },
      error: (_response: any) => {
        this.surveyResponse = null;
        this.isLoading = false;
        this.onClose();
      },
    });
  }

  onClose() {
    this.modalRef?.hide();
  }

}
