import { Component, ViewChild, TemplateRef, inject, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { Quotation } from '../../../shared/services/quotation';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-send-for-approval-popup',
  standalone: true,
  imports: [CommonModule, ModalModule],
  providers: [BsModalService],
  templateUrl: './send-for-approval-popup.html',
  styleUrl: './send-for-approval-popup.scss'
})
export class SendForApprovalPopupComponent {
  public modalRef!: BsModalRef;
  public prospectName: string = '';
  public contractId: string = '';
  public customerCode: string = '';
  public isSubmitted: boolean = false;
  public selectedFile: File | null = null;
  @Output() onSuccess = new EventEmitter<void>();
  
  private modalService = inject(BsModalService);
  private toasterService = inject(ToastrService);
  private quotationService = inject(Quotation);
  private sweetAlertService = inject(SweetAlertService);

  @ViewChild('approvalTemplate') approvalTemplate!: TemplateRef<any>;

  show(prospectName: string, contractId: string = '', customerCode: string = '') {
    this.prospectName = prospectName;
    this.contractId = contractId;
    this.customerCode = customerCode;
    this.isSubmitted = false;
    this.selectedFile = null;
    this.modalRef = this.modalService.show(this.approvalTemplate, { class: 'modal-md modal-dialog-centered modal-dialog-scrollable', backdrop: 'static' });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit() {
    this.isSubmitted = true;
    if (!this.selectedFile) {
      return;
    }
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('contractId', this.contractId);

    this.quotationService.sendApproval(this.customerCode, formData).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.sweetAlertService.success(res.message || 'Successfully sent for approval.');
          this.onSuccess.emit();
          this.closePopup();
        } else {
          this.sweetAlertService.error(res?.message || 'Failed to send approval.');
        }
      },
      error: (err: any) => {
        if (err.error && err.error.errors) {
          const errorMessages = Object.values(err.error.errors).flat().join(', ');
          this.sweetAlertService.error(errorMessages || 'Validation failed.');
        } else if (err.error && err.error.message) {
          this.sweetAlertService.error(err.error.message);
        } else {
          this.sweetAlertService.error(err.message || 'Failed to send approval.');
        }
      }
    });
  }

  closePopup() {
    this.modalRef?.hide();
  }
}
