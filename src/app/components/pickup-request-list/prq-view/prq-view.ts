import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DocketHistoryComponent } from '../docket-history/docket-history';

@Component({
  selector: 'app-prq-view',
  imports: [CommonModule,DocketHistoryComponent],
  providers: [BsModalService],
  templateUrl: './prq-view.html',
  styleUrl: './prq-view.scss',
})
export class PrqView {
   @ViewChild('Templatepod', { static: true }) Templatepod!: TemplateRef<any>;
   @ViewChild('detailsModalTemplate') detailsModalTemplate!: TemplateRef<any>;
   @ViewChild('docketHistoryComponent') docketHistoryComponent!: DocketHistoryComponent;
   
   public modalRef!: BsModalRef;
   public detailModalRef?: BsModalRef;
   public env=environment;
  public prqData: any = null;
  public listSubscription?:Subscription;
  public isLoading: boolean = false;
  
  public detailList: any[] = [];
  public isDetailLoading: boolean = false;
  public groupedDocketDetails: any[] = [];

   public assignmentHistory: any[] = [];
  public isHistoryLoading: boolean = false;
  
  public totalEwayBills: number = 0;
  public totalDimensions: number = 0;

  constructor(
    private modalService: BsModalService,
    private expenseGeneralService: ExpenseGeneralService,
    private sweetAlertService: SweetAlertService
  ) {}

  showPopup(prqNo: string) {
       this.modalRef = this.modalService.show(this.Templatepod, {
      backdrop: 'static',
      class: 'modal-xl modal-dialog-centered'
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
          this.fetchDocketDetails(prqNo);
          this.getAssignmentHistory(prqNo);
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

  fetchDocketDetails(prqNo: string) {
    this.isDetailLoading = true;
    this.groupedDocketDetails = [];
    
    // API payload to fetch EWay Bill and Volumetric details (ReportId 286)
    const payload = {
      "FilterJson": {
        "ReportId": '286',
        "IndentNo": prqNo
      }
    };

    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        this.isDetailLoading = false;
        if (response && response.Table1) {
          const dockets = response.Table1 || [];
          const invoices = response.Table2 || [];
          const dimensions = response.Table3 || [];
          
          this.groupDetailsByDocket(dockets, invoices, dimensions);
        } else {
          this.groupedDocketDetails = [];
        }
      },
      error: (error: any) => {
        this.isDetailLoading = false;
        // Don't show error if no details found, just leave empty
      }
    });
  }

  // This method groups the list of EWay/Volumetric details into a structured array
  // where each Docket has its own list of invoices and dimensions.
  groupDetailsByDocket(dockets: any[], invoices: any[], dimensions: any[]) {
    this.totalEwayBills = invoices.length;
    this.totalDimensions = dimensions.length;
    
    this.groupedDocketDetails = dockets.map(docket => {
      const dockNo = docket.DOCKNO || docket.DockNo;
      return {
        dockNo: dockNo,
        indentNo: docket.IndentNo,
        ...docket,
        invoices: invoices.filter((inv: any) => (inv.DOCKNO || inv.DockNo) === dockNo),
        dimensions: dimensions.filter((dim: any) => (dim.DOCKNO || dim.DockNo) === dockNo)
      };
    });
  }

  scrollToDocketDetails() {
    const element = document.getElementById('docketDetailsSection');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openDocketHistory() {
    if (!this.prqData) return;
    const indentNo = this.prqData.IndentNo || this.prqData.PRQNo;
    this.docketHistoryComponent.showPopup(indentNo);
  }

  viewInvoice(item:any){
      // const baseUrl = `${this.env.liveUrl}UploadedDocumentsBAK/EwaybillInvoiceFile/Upload/${item}`; // Update folder name if needed
      // window.open(baseUrl, '_blank');
  }

    getAssignmentHistory(prqNo: string) {
    this.isHistoryLoading = true;
    this.assignmentHistory = [];
    const payload = {
      "FilterJson": {
        "ReportId": "386",
        "PRQNo": prqNo
      }
    };

    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        this.isHistoryLoading = false;
        if (response && response.Table1) {
          this.assignmentHistory = response.Table1;
        }
      },
      error: (error: any) => {
        this.isHistoryLoading = false;
      }
    });
  }
}
