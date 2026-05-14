import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild, ElementRef } from '@angular/core';
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
  
  public expenseResponse: any = null;
  public isLoading: boolean = false;
  public claimForm!: FormGroup;

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

  initForm() {
    this.claimForm = new FormGroup({
      categoryId: new FormControl(null, Validators.required),
      expenseDate: new FormControl(new Date(), Validators.required),
      description: new FormControl('', [Validators.maxLength(500)]),
      amount: new FormControl(null, [Validators.required, Validators.min(0.01)]),
      customerId: new FormControl(null)
    });
    this.selectedFile = null;
    this.filePreview = null;
  }

  onClose() {
    this.modalRef?.hide();
  }

  showPopup(apiCall: () => any) {
    this.getExpenseCategory();
    this.isLoading = true;
    this.expenseResponse = null;
    this.initForm();
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: 'static' });
    
    apiCall().subscribe({
      next: (response: any) => {
        const data = response?.data;
        if (data) {
          this.isLoading = false;
          this.expenseResponse = data;
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
    if (this.claimForm.valid) {
      const formData = this.claimForm.getRawValue();
      const payload = {
        ExpenseCode: this.expenseResponse?.expenseId || '', // Assuming expenseId maps to ExpenseCode
        CategoryId: formData.categoryId,
        CustomerId: formData.customerId,
        ExpenseDate: formData.expenseDate,
        Description: formData.description,
        Amount: formData.amount,
        AttachmentPath: this.selectedFile ? this.selectedFile.name : null, // This should normally be handled via multipart/form-data or presigned URL
        CreatedBy: this.commonService.globalFilters.UserID
      };
      
      console.log('Claim Payload:', payload);
      this.sweetAlertService.success('Expense Claim Submitted Successfully!');
      this.onClose();
    } else {
      this.claimForm.markAllAsTouched();
    }
  }
}
