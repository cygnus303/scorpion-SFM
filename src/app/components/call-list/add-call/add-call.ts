import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CallService } from '../../../shared/services/call.service';
import { ExternalService } from '../../../shared/services/external.service';
import { CustomerService } from '../../../shared/services/customer.service';
import { CommonService } from '../../../shared/services/common.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeneralMasterResponse } from '../../../shared/models/external.model';
import { UserResponse } from '../../../shared/models/meeting.model';
import { timeRangeValidator } from '../../../shared/validators/time-range.validators';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { CallDetailResponse } from '../../../shared/models/call.model';
@Component({
  selector: 'app-add-call',
  imports: [FormsModule, CommonModule, NgSelectModule, BsDatepickerModule, ReactiveFormsModule],
  templateUrl: './add-call.html',
  styleUrl: './add-call.scss',
})
export class AddCall {
  public callForm!: FormGroup;
  public callCategories: GeneralMasterResponse[] = [];
  public callStatuses: GeneralMasterResponse[] = [];
  public users: UserResponse[] = [];
  public callPurposes: GeneralMasterResponse[] = [];
  public isSubmitting = false;
  public modalRef!: BsModalRef;
  public callId: string = '';
  public selectedCall: CallDetailResponse | null = null;

  @ViewChild('Templatepod', { static: true }) Templatepod!: TemplateRef<any>;



  constructor(
    private callService: CallService,
    private externalService: ExternalService,
    public customerService: CustomerService,
    public commonService: CommonService,
    public router: Router,
    private modalService: BsModalService,
    private sweetAlertService: SweetAlertService,
  ) { this.callForm = new FormGroup({}); this.buildForm(); }


  showPopup(call?: any) {
    this.buildForm();
    this.getCallCategories();
    this.getCallPurposes();
    this.getCallStatuses();

    if (call) {
      console.log(call)
      this.getCall(call.callId);
      this.callId = call.callId;
    } else {
        this.callId = '';
    }
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
  }

  getCall(callCode: string) {
    this.commonService.updateLoader(true);
    this.callService.getCallDetails(callCode, this.commonService.globalFilters.UserID.toString(),).subscribe({
      next: (response) => {
        const callStatusId = this.callStatuses.find((d) => d.codeId.toString() === '2')?.codeId
        if (response) {
          this.selectedCall = response.data;
          this.callForm.patchValue({
            ...this.selectedCall,
            companyName: this.selectedCall.customerName || this.selectedCall.companyName,
            callCategoryId: this.selectedCall.callCategoryId?.toString(),
            callStatusId: this.selectedCall.callStatusId?.toString() ? this.selectedCall.callStatusId?.toString() : callStatusId,
            leadId: this.selectedCall.leadId ? this.selectedCall.leadId : '',
          })
        }
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.commonService.updateLoader(false);
      },
    });
  }

  buildForm(): void {
    const callStatusId = this.callStatuses.find((d) => d.codeId.toString() === '2')?.codeId
    const todayDate = new Date();
    this.callForm = new FormGroup({
      callPurpose: new FormControl(null, [Validators.required]),
      callDate: new FormControl(todayDate, [Validators.required]),
      startTime: new FormControl(null, [Validators.required]),
      endTime: new FormControl(null, [Validators.required]),
      callCategoryId: new FormControl(null, [Validators.required]),
      callStatusId: new FormControl(callStatusId),
      customerCode: new FormControl(''),
      remarks: new FormControl(null, [Validators.required]),
      userid: new FormControl(''),
      leadId: new FormControl(''),
      companyName: new FormControl(''),
      callId: new FormControl('')
    },
    );
  }

  // futureDateValidator(control: AbstractControl) {
  //     const value: string | null = control.value;
  //     if (value) {
  //       const parts = value.split('/');
  //       const day = parseInt(parts[0], 10);
  //       const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript (0 for January)
  //       const year = parseInt(parts[2], 10);
  //       const selectedDate = new Date(year, month, day);
  //       const today = new Date();
  //       today.setHours(0, 0, 0, 0);
  //       if (selectedDate < today) {
  //         return { notFutureDate: true };
  //       }
  //     }
  //     return null;
  // }

  getCallCategories(searchText: string | null = null) {
    this.commonService.updateLoader(true);
    return this.externalService
      .getGeneralMaster(searchText, 'CALLCAT')
      .subscribe({
        next: (response) => {
          if (response) {
            this.callCategories = response.data;
          }
          this.commonService.updateLoader(false);
        },
        error: (response: any) => {
          this.sweetAlertService.error(response);
          this.commonService.updateLoader(false);
        },
      });
  }

  getCallStatuses(searchText: string | null = null) {
    this.commonService.updateLoader(true);
    return this.externalService
      .getGeneralMaster(searchText, 'CALLSTATUS')
      .subscribe({
        next: (response) => {
          if (response) {
            this.callStatuses = response.data;
          }
          this.commonService.updateLoader(false);
        },
        error: (response: any) => {
          this.sweetAlertService.error(response);
          this.commonService.updateLoader(false);
        },
      });
  }

  getCallPurposes(searchText: string | null = null) {
    this.commonService.updateLoader(true);
    return this.externalService
      .getGeneralMaster(searchText, 'CALLPUR')
      .subscribe({
        next: (response) => {
          if (response) {
            this.callPurposes = response.data;
          }
          this.commonService.updateLoader(false);
        },
        error: (response: any) => {
          this.sweetAlertService.error(response);
          this.commonService.updateLoader(false);
        },
      });
  }

  onClose() {
    this.callForm.reset();
    this.buildForm();
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  onSubmitCall(form: FormGroup): void {
    if (this.customerService.customersList) {
      var customerCode = this.customerService.customersList.find((d) => d.customerName === form.value.companyName)?.customerCode
    }
    if (form.valid) {
      this.isSubmitting = true;
      let { companyName, callId, ...dataToSubmit } = form.value;
      dataToSubmit.userid = this.commonService.globalFilters.UserID.toString(),
        dataToSubmit.customerCode = dataToSubmit.customerCode ? dataToSubmit.customerCode : '';
      dataToSubmit.customerCode = dataToSubmit.customerCode ? dataToSubmit.customerCode : customerCode;
      !this.callId ? this.addCall(dataToSubmit) : this.updateCall(dataToSubmit);
    } else {
      this.callForm.markAllAsTouched()
    }
  }

  addCall(form: any): void {
    this.commonService.updateLoader(true);
    this.callService.addCall(form).subscribe({
      next: (response) => {
        if (response.success) {
          this.sweetAlertService.success(response.data.message);
          this.onClose();
          this.callForm.reset();
        } else {
          this.sweetAlertService.error(response.error.message);
        }
        this.isSubmitting = false;
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
        this.isSubmitting = false;
        this.commonService.updateLoader(false);
      },
    });
  }

  updateCall(form: any): void {
    this.commonService.updateLoader(true);
    this.callService.updateCall(this.callForm.value.callId, form).subscribe({
      next: (response) => {
        if (response.success) {
          this.sweetAlertService.success(response.data.message);
          this.onClose();
          this.callForm.reset();
        } else {
          this.sweetAlertService.error(response.error.message);
        }
        this.isSubmitting = false;
        this.commonService.updateLoader(false);
      }
    });
  }
}
