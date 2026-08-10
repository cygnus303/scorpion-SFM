import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-prq-view',
  imports: [CommonModule],
  providers: [BsModalService],
  templateUrl: './prq-view.html',
  styleUrl: './prq-view.scss',
})
export class PrqView {
    @ViewChild('Templatepod', { static: true }) Templatepod!: TemplateRef<any>;
   public modalRef!: BsModalRef;
  public prqData: any = null;
  public listSubscription?:Subscription;
  public isLoading: boolean = false;

  constructor(
    private modalService: BsModalService,
    private expenseGeneralService: ExpenseGeneralService,
    private sweetAlertService: SweetAlertService
  ) {}

  showPopup(prqNo: string) {
       this.modalRef = this.modalService.show(this.Templatepod, {
      backdrop: 'static',
      class: 'modal-lg modal-dialog-centered'
    });
    this.getPRQDetail(prqNo)
    
  }

  getPRQDetail(prqNo: string){
      if (this.listSubscription) { this.listSubscription.unsubscribe(); }
    this.isLoading = true;
    const payload = {
      "FilterJson": {
        "ReportId": "8",
        "PRQNo": prqNo
      }
    };
    
    this.listSubscription=this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.Table1 && response.Table1.length > 0) {
          this.prqData = response.Table1[0];
          
        } else {
          this.sweetAlertService.error("PRQ details not found!");
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.sweetAlertService.error("Failed to load PRQ details.");
      }
    });
  }

  onClose() {
    this.modalRef.hide();
    this.prqData = null;
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'generated': return 'bg-primary text-white';
      case 'assigned': return 'bg-info text-white';
      case 'cancelled': return 'bg-danger text-white';
      case 'arranged': return 'bg-success text-white';
      default: return 'bg-secondary text-white';
    }
  }
}
