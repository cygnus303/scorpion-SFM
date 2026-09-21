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
          this.detailList = response.Table1;
          // Group the flattened API response by Docket No.
          this.groupDetailsByDocket();
        } else {
          this.detailList = [];
        }
      },
      error: (error: any) => {
        this.isDetailLoading = false;
        // Don't show error if no details found, just leave empty
      }
    });
  }

  // This method groups the flat list of EWay/Volumetric details into a structured array
  // where each Docket has its own list of invoices and dimensions.
  groupDetailsByDocket() {
    const groups: { [key: string]: any } = {};
    this.totalEwayBills = 0;
    this.totalDimensions = 0;
    
    this.detailList.forEach(item => {
      // Find the Docket number from the item object
      const dockNo = item.DOCKNO || item.DockNo;
      if (!dockNo) return;
      
      // Initialize the group for this Docket if it doesn't exist yet
      if (!groups[dockNo]) {
        groups[dockNo] = {
          dockNo: dockNo,
          indentNo: item.IndentNo,
          invoices: [],
          dimensions: []
        };
      }
      
      const invoiceExists = groups[dockNo].invoices.find((inv: any) => inv.INVNO === item.INVNO && inv.EWayBillNo === item.EWayBillNo);
      if (!invoiceExists && (item.INVNO || item.EWayBillNo)) {
        groups[dockNo].invoices.push(item);
        this.totalEwayBills++;
      }
      
      const dimensionExists = groups[dockNo].dimensions.find((dim: any) => dim.SrNo === item.SrNo);
      if (!dimensionExists && item.VOL_L) {
        groups[dockNo].dimensions.push(item);
        this.totalDimensions++;
      }
    });
    
    this.groupedDocketDetails = Object.values(groups);
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
