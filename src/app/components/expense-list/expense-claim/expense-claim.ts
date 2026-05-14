import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { GeneralMaster } from '../../../shared/models/expenseGeneral.model';
import { NgSelectModule } from '@ng-select/ng-select';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PrqService } from '../../../shared/services/prq-service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { CommonService } from '../../../shared/services/common.service';
import { ExpenseService } from '../../../shared/services/expense.service';

@Component({
  selector: 'app-expense-claim',
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, BsDatepickerModule],
  templateUrl: './expense-claim.html',
  styleUrl: './expense-claim.scss',
  providers: [DatePipe]
})
export class ExpenseClaim {
  public modalRef!: BsModalRef;
  public expenseCategoryData: GeneralMaster[] = [];
  public customerData: any[] = [];
  public customerSearchSubject: Subject<string> = new Subject<string>();

  public modalService = inject(BsModalService);
  private expenseGeneralService = inject(ExpenseGeneralService);
  private prqService = inject(PrqService);
  private sweetAlertService = inject(SweetAlertService);
  public commonService = inject(CommonService);
  private expenseService = inject(ExpenseService);

  public expenseResponse: any = null;
  public isLoading: boolean = false;
  public claimForm!: FormGroup;
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter<string>();

  // File upload state
  public selectedFile: File | null = null;
  public isImagePreview: boolean = false;
  public isPdfPreview: boolean = false;
  public filePreview: string | ArrayBuffer | null = null;

  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;
  @ViewChild('fileInput') fileInput!: ElementRef;

  ngOnInit() {
    this.initForm();
    this.customerSearchSubject.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((term: string) => {
      if (term?.trim() && term.length >= 3) {
        this.prqService.getCustomerList(term).subscribe((res: any) => {
          this.customerData = res.data;
        });
      } else {
        this.customerData = [];
      }
    });
  }

  public isSubmitted: boolean = false;

  initForm() {
    this.claimForm = new FormGroup({
      fleetType: new FormControl(null, Validators.required),
      loadingDate: new FormControl(new Date(), Validators.required),
      description: new FormControl('', [Validators.maxLength(500)]),
      amount: new FormControl(null, [Validators.required, Validators.min(0.01)]),
      customerId: new FormControl(null)
    });
    this.selectedFile = null;
    this.filePreview = null;
    this.isSubmitted = false;
  }

  onClose() {
    this.modalRef?.hide();
  }

  showPopup(apiCall: () => any) {
    this.getExpenseCategory();
    this.isLoading = true;
    this.expenseResponse = null;
    this.initForm();
    this.isSubmitted = false;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: 'static' });

    apiCall().subscribe({
      next: (response: any) => {
        const data = response?.data;
        if (data) {
          this.isLoading = false;
          this.expenseResponse = data;
          this.claimForm.patchValue({
            customerId: data.customerName || data.companyName
          });
        }
      },
      error: (response: any) => {
        this.isLoading = false;
        this.expenseResponse = null;
        this.sweetAlertService.error(response);
      },
    });
  }

  getExpenseCategory(searchText: string | null = null) {
    this.expenseGeneralService.getGeneralMaster(searchText, 'EXPCAT').subscribe({
      next: (response: any) => {
        if (response) {
          this.expenseCategoryData = response.data;
        }
      }
    });
  }

  getCustomerList(event: any) {
    this.customerSearchSubject.next(event.term);
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.sweetAlertService.error('File size exceeds 5MB limit');
        return;
      }
      this.selectedFile = file;
      this.isImagePreview = file.type.startsWith('image/');
      this.isPdfPreview = file.type === 'application/pdf';

      if (this.isImagePreview) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.filePreview = e.target?.result || null;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.filePreview = null;
    this.isImagePreview = false;
    this.isPdfPreview = false;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSubmit() {
    this.isSubmitted = true;
    if (this.claimForm.valid && this.selectedFile) {
      const formData = this.claimForm.getRawValue();

      const uploadData = new FormData();
      uploadData.append('ExpenseCode', this.expenseResponse?.expenseId || '');
      uploadData.append('CategoryId', formData.fleetType);
      uploadData.append('CustomerId', formData.customerId || '');

      // Format date
      const dateVal = formData.loadingDate instanceof Date ? formData.loadingDate.toISOString() : formData.loadingDate;
      uploadData.append('ExpenseDate', dateVal);

      uploadData.append('Description', formData.description || '');
      uploadData.append('Amount', formData.amount.toString());
      uploadData.append('AttachmentPath', this.selectedFile.name);
      uploadData.append('CreatedBy', this.commonService.globalFilters.UserID.toString());
      uploadData.append('file', this.selectedFile);

      this.expenseService.claimExpense(uploadData).subscribe({
        next: (response: any) => {
          this.dataEmitter.emit();
          this.sweetAlertService.success('Expense Claim Submitted Successfully!');
          this.onClose();
        },
        error: (error: any) => {
          this.sweetAlertService.error(error);
        }
      });
    } else {
      this.claimForm.markAllAsTouched();
    }
  }
}
