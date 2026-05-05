import { Component, EventEmitter, inject, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExpenseService } from '../../../shared/services/expense.service';
import { ExternalService } from '../../../shared/services/external.service';
import { CommonService } from '../../../shared/services/common.service';
import { IdentityService } from '../../../shared/services/identity.service';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { todayDate } from '../../../shared/constants/common';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';


@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, BsDatepickerModule],
  templateUrl: './add-expense.html',


  styleUrl: './add-expense.scss',
})
export class AddExpense {
  public modalRef!: BsModalRef;
  public modalService = inject(BsModalService);
  public expenseForm!: FormGroup;
  public expenseId: string = '';
  public transportModes: any[] = [];
  public getGeneralmaster: any[] = [];
  public selectedFile: File | null = null;
  public fileUrl: SafeResourceUrl | string | null = null;
  public isImage: boolean = false;
  public isPdf: boolean = false;
  public parsedUser: any;
  public isSubmitting: boolean = false;
  public isMeetingList: string = 'Add';
  public isLoading: boolean = false;
  public expenseResponse: any = null;



  @Output() dataEmitter: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;

  constructor(
    private sweetAlertService: SweetAlertService,
    private expenseService: ExpenseService,
    private externalService: ExternalService,
    private commonService: CommonService,
    private identityService: IdentityService,
    private expenseGeneralService: ExpenseGeneralService,
    private sanitizer: DomSanitizer,
  ) { }

  buildForm(): void {
    const assignedTo = this.identityService.getLoggedUserId();
    this.expenseForm = new FormGroup({
      TransportModeId: new FormControl('', Validators.required),
      ExpenseDate: new FormControl(todayDate, [Validators.required]),
      punchedInLocation: new FormControl(null),
      checkedInLocation: new FormControl(null),
      DistanceInKm: new FormControl(null),
      Amount: new FormControl(null),
      remarks: new FormControl(null, [Validators.required]),
      meetingId: new FormControl(null),
      customerName: new FormControl(),
      MeetingDate: new FormControl(todayDate),
      checkedOutLocation: new FormControl(null),
      expRate: new FormControl(),
      expenseCode: new FormControl(),
      SupportingDocument: new FormControl(''),
      CreatedBy: new FormControl(assignedTo),
      AttendeeCode: new FormControl('')
    });
  }

  showPopup(apiCall: () => any) {
    this.buildForm();
    this.getTransportModes();
    this.getGeneralmasterList();
    this.isLoading = true;
    this.expenseResponse = null;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
    apiCall().subscribe({
      next: (response: any) => {
        const data = response?.data;
        if (data) {
          this.isLoading = false;
          this.expenseResponse = data;
          this.expenseId = data.expenseId;
          this.expenseForm.patchValue({
            checkedOutLocation: data.checkedOutLocation,
            expenseCode: data.expenseId,
            customerName: data.companyName,
            MeetingDate: data.expenseDate,
            TransportModeId: data.transportModeId === "0" ? '' : data.transportModeId || null,
            ExpenseDate: data.expenseDate,
            checkedInLocation: data.checkedInLocation,
            DistanceInKm: data.distanceInKm || data.distanceTravelled,
            expRate: data.expenseRate,
            Amount: data.amount,
            remarks: data.remarks,
            meetingId: data.meetingId,
            punchedInLocation: data.punchedInLocation,
            AttendeeCode: data.attendeeCode
          });
          this.fileUrl = data.supportingDocument;
          this.OntransportModeChange(data.transportModeId);
        }
      },
      error: (response: any) => {
        this.isLoading = false;
        this.expenseResponse = null;
        this.onClose();
      },
    });
  }



  onClose() {
    this.modalRef?.hide();
    this.expenseForm.reset();
    this.buildForm();
  }

  getTransportModes() {
    this.externalService.getGeneralMaster(null, 'SERCAT').subscribe({
      next: (response) => {
        if (response) this.transportModes = response.data;
      }
    });
  }

  getGeneralmasterList() {
    const filters = { Page: 1, PageSize: 5000, export: false };
    this.expenseGeneralService.getGeneralmasterList(filters).subscribe({
      next: (response) => {
        if (response) this.getGeneralmaster = response.data;
      }
    });
  }

  OntransportModeChange(data: any) {
    const storedUser = localStorage.getItem('loginUser');
    this.parsedUser = JSON.parse(storedUser || '{}');
    const ratePerKMObj = this.getGeneralmaster.find(
      (d) => d.designationId?.toString() === this.parsedUser.designationId?.toString() &&
        d.transportModeId?.toString() === data?.toString()
    );
    const expRate = ratePerKMObj?.ratePerKM ?? 0;
    const amount = expRate * (this.expenseForm.value.DistanceInKm || 0);
    this.expenseForm.patchValue({
      expRate: expRate,
      Amount: amount
    });
  }

  handleInputChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedFile = file;
    const fileUrl = URL.createObjectURL(file);
    this.fileUrl = this.sanitizer.bypassSecurityTrustUrl(fileUrl);
    this.isImage = file.type.startsWith('image');
    this.isPdf = file.type === 'application/pdf';
  }

  onSubmitExpense(form: FormGroup): void {
    if (form.valid) {
      this.isSubmitting = true;
      const formData = new FormData();
      formData.append("ModifiedBy", "");
      formData.append("CheckedInLocation", form.value.checkedInLocation || '');
      formData.append("ExpenseDate", form.value.ExpenseDate);
      formData.append("UserId", this.identityService.getLoggedUserId());
      formData.append("PunchedInLocation", form.value.punchedInLocation || null);
      formData.append("TransportModeId", form.value.TransportModeId);
      formData.append("Remarks", form.value.remarks);
      formData.append("MeetingId", form.value.meetingId || '');
      formData.append("Amount", form.value.Amount);
      formData.append("DistanceInKm", form.value.DistanceInKm || 0);
      formData.append("AttendeeCode", form.value.AttendeeCode || '');
      formData.append("CreatedBy", this.identityService.getLoggedUserId());
      if (this.selectedFile) {
        formData.append("SupportingDocument", this.selectedFile.name);
        formData.append("file", this.selectedFile);
      }

      this.updateExpense(formData);
    } else {
      this.expenseForm.markAllAsTouched();
    }
  }

  updateExpense(dataToSubmit: any): void {
    this.commonService.updateLoader(true);
    this.expenseService.updateExpense(this.expenseId, dataToSubmit).subscribe({
      next: (response) => {
        if (response.success) {
          this.sweetAlertService.success(response.data.message);
          this.dataEmitter.emit();
          this.onClose();
        } else {
          this.sweetAlertService.error(response.error.message);
        }
        this.isSubmitting = false;
        this.commonService.updateLoader(false);
      },
      error: (err) => {
        this.sweetAlertService.error(err.error?.message || 'Error updating expense');
        this.isSubmitting = false;
        this.commonService.updateLoader(false);
      }
    });
  }
}
