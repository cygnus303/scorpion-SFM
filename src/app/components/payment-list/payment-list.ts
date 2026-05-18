import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { CommonService } from '../../shared/services/common.service';
import { ExportService } from '../../shared/services/export.service';
import { IdentityService } from '../../shared/services/identity.service';
import { Payment } from '../../shared/services/payment';
import { PaymentResponse } from '../../shared/models/payment.model';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-payment-list',
  imports: [CommonModule, RouterModule, FormsModule, PopoverModule, PaginationModule],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
})
export class PaymentList {
  public showTable = true;
  public loading: boolean = false;
  public isdownloadLoading: boolean = false;
  totalItems = 0; // Total number of items
  public paymentList: PaymentResponse[] = [];
  private destroy$ = new Subject<void>();
  constructor(
    private paymentservice: Payment,
    private sweetAlertService: SweetAlertService,
    public commonService: CommonService,
    private exportService: ExportService,
    private identityService: IdentityService
  ) {
  }

  ngOnInit() {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getPayment();
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTable() {
    this.showTable = this.showTable;
  }

  getPayment(page: number = this.commonService.globalFilters.Page) {
    this.commonService.globalFilters.Page = page;
    const filters = {
      Page: this.commonService.globalFilters.Page.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      SearchFilter: this.commonService.globalFilters.searchText,
    }
    this.loading = true;
    this.paymentservice.getPaymentList(filters).subscribe({
      next: (response: any) => {
        if (response) {
          this.paymentList = response.data;
          this.totalItems = response.totalCount;
        }
        this.loading = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response.error.message);
        this.loading = false;
      },
    })
  }

  downloadSampleImport() {
    this.paymentservice.downloadSample().subscribe({
      next: (response: Blob) => {
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'RTGS_Template.xlsx';
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
    });
  }

  triggerFileInput(event: Event) {
    event.preventDefault();
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  onFileChange(event: any) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];


    if (file) {
      const validExcelTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'application/vnd.ms-excel', // XLS
        'text/csv', // CSV
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // XLSB
        'application/vnd.ms-excel.sheet.macroEnabled.12', // XLSM
        'application/vnd.openxmlformats-officedocument.spreadsheetml.template', // XLTX
        'application/vnd.ms-excel.template.macroEnabled.12', // XLTM
      ];
      if (validExcelTypes.includes(file.type)) {
        const formData = new FormData();
        formData.append('file', file);
        this.uploadUTR(formData);
      } else {
        this.sweetAlertService.error(
          'Please upload a valid excel file (XLSX, XLS, or CSV).'
        );
        // this.selectedFile = null;
      }
      fileInput.value = '';
    }
  }

  uploadUTR(dataToSubmit: any): void {
    // this.commonService.updateLoader(true);
    this.paymentservice.uploadExcel(dataToSubmit).subscribe({
      next: (response) => {
        // this.commonService.updateLoader(false);
        if (response.success) {
          this.sweetAlertService.success(response.data.message);
          this.getPayment();
        }
      },
      error: (error: any) => {
        this.sweetAlertService.error(error.message || 'An error occurred during import.');
        // this.commonService.updateLoader(false);
      },
    });
  }

  downloadExcel() {
    this.isdownloadLoading = true;
    this.paymentservice.DownloadExcel(this.identityService.getLoggedUserId()).subscribe({
      next: (response: Blob) => {
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'RTGS UTR Report.xlsx';
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.isdownloadLoading = false;

      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.isdownloadLoading = false;

      },
    });
  }

  downloadSelectedUTR() {

    const selectedData = this.paymentList.filter((item: any) => item.selected);

    if (selectedData.length === 0) {
      alert('Please select at least one record');
      return;
    }

    const excelData = selectedData.map((item: any) => ({
      'Payment ID': item.requestID,
      'BeneficiaryAccountNo': '',
      'BeneficiaryName': '',
      'RTGSAmount': item.approvedAmt,
      'UTRNo': item.utrNo,
      'UTRDate': item.utrDate
    }));

    this.exportService.exportToExcel(excelData);
  }


  hasSelection(): boolean {
    return this.paymentList.some((item: any) => item.selected);
  }

  getSelectedCount(): number {
    return this.paymentList.filter((item: any) => item.selected).length;
  }

  selectAll(event: any): void {
    const isChecked = event.target.checked;
    this.paymentList.forEach(payment => payment.selected = isChecked);
  }

  isAllSelected(): boolean {
    return this.paymentList.length > 0 && this.paymentList.every(payment => payment.selected);
  }

  onPageChange(event: any) {
    this.getPayment(event.page);
  }
}
