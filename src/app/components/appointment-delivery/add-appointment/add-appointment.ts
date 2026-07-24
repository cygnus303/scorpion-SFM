import { Component, TemplateRef, ViewChild, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalService, BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { AppointmentDeliveryService } from '../../../shared/services/appointment-delivery.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { CommonService } from '../../../shared/services/common.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-add-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalModule, BsDatepickerModule],
  templateUrl: './add-appointment.html',
  styleUrl: './add-appointment.scss'
})
export class AddAppointment implements OnInit {
  @ViewChild('addModal', { static: true }) addModal!: TemplateRef<any>;
  @Output() onSaved = new EventEmitter<void>();

  modalRef?: BsModalRef;
  private modalService = inject(BsModalService);
  private complaintService = inject(ComplaintService);
  public commonService = inject(CommonService);
  private appointmentDeliveryService = inject(AppointmentDeliveryService);
  private sweetAlertService = inject(SweetAlertService);
  isSaving: boolean = false;
  isDocketLoading: boolean = false;
  docketEligibilityError: string = '';

  appointmentForm = new FormGroup({
    entryType: new FormControl('APMT'),
    docketNo: new FormControl('', [Validators.required]),
    orgDest: new FormControl(''),
    currentStatus: new FormControl(''),
    docketDate: new FormControl(''),
    edd: new FormControl(''),
    consigneeName: new FormControl(''),
    consigneeContact: new FormControl(''),
    consigneeAddress: new FormControl(''),
    consigneeEmail: new FormControl(''),
    appointmentDate: new FormControl(''),
    personName: new FormControl(''),
    contactNo: new FormControl(''),
    timeFrom: new FormControl(''),
    timeTo: new FormControl(''),
    remarks: new FormControl(''),
    desitnationCode: new FormControl(''),
    originCode: new FormControl(''),
  });

  get entryType() {
    return this.appointmentForm.get('entryType')?.value || 'APMT';
  }

  ngOnInit() {
    this.updateValidations(this.entryType);

    this.appointmentForm.get('entryType')?.valueChanges.subscribe(val => {
      this.updateValidations(val);
    });

    this.appointmentForm.get('docketNo')?.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged()
    ).subscribe(() => {
      this.fetchDocketDetails();
    });
  }

  updateValidations(type: string | null | undefined) {
    const apmtFields = ['appointmentDate', 'personName', 'timeFrom', 'timeTo', 'remarks'];
    if (type === 'APMT') {
      apmtFields.forEach(field => {
        this.appointmentForm.get(field)?.setValidators([Validators.required]);
        this.appointmentForm.get(field)?.updateValueAndValidity();
      });
      this.appointmentForm.get('contactNo')?.setValidators([Validators.required, Validators.pattern('^[0-9]{10}$')]);
      this.appointmentForm.get('contactNo')?.updateValueAndValidity();
    } else {
      apmtFields.forEach(field => {
        this.appointmentForm.get(field)?.clearValidators();
        this.appointmentForm.get(field)?.updateValueAndValidity();
      });
      this.appointmentForm.get('contactNo')?.clearValidators();
      this.appointmentForm.get('contactNo')?.updateValueAndValidity();
    }
  }

  numberOnly(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  openModal(defaultTab: 'APMT' | 'CSD' | 'MSD' = 'APMT') {
    this.appointmentForm.reset();
    this.appointmentForm.patchValue({ entryType: defaultTab });
    this.modalRef = this.modalService.show(this.addModal, {
      class: 'modal-lg modal-dialog-centered',
      backdrop: 'static'
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  submitForm() {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const formValue = this.appointmentForm.value;

    if (formValue.entryType === 'APMT') {
      this.saveApmt(formValue);
    } else if (formValue.entryType === 'CSD' || formValue.entryType === 'MSD') {
      this.saveCsdMsd(formValue);
    }
  }

  saveCsdMsd(formValue: any) {
    const payload = {
      docket: formValue.docketNo || '',
      type: formValue.entryType,
      baseUserName: this.commonService.globalFilters.UserID.toString()
    };
    
    this.isSaving = true;
    this.appointmentDeliveryService.generateCsdMsdNo(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res && res.success) {
          const generatedNo = res.data?.csdMsd || '';
          const msg = res.message || `${formValue.entryType} generated successfully!`;
          const msgHtml = `<b>${msg}</b><br/><br/>${formValue.entryType} ID: <span style="color:#CC0000; font-weight:bold;">${generatedNo}</span>`;

          this.sweetAlertService.success(msgHtml).then(() => {
            this.onSaved.emit();
            this.closeModal();
          });
        } else {
          this.sweetAlertService.error(res?.message || '');
        }
      },
      error: (err) => {
        this.isSaving = false;
        const errorMsg = err?.error?.data?.message || err?.error?.message || err?.message || '';
        this.sweetAlertService.error(errorMsg);
      }
    });
  }

  saveApmt(formValue: any) {
    let appointmentDateIso = '';
    if (formValue.appointmentDate) {
      try {
        appointmentDateIso = new Date(formValue.appointmentDate).toISOString();
      } catch (e) {
        appointmentDateIso = formValue.appointmentDate;
      }
    }
    const payload = {
      appointmentNo: "",
      dockno: formValue.docketNo || "",
      op_Status: formValue.currentStatus || "",
      csgecd: formValue.originCode || "",
      csgenm: formValue.consigneeName || "",
      destcd: formValue.desitnationCode || "",
      appointment: appointmentDateIso,
      isEnabled: true,
      person: formValue.personName || "",
      mobile: formValue.contactNo || "",
      remark: formValue.remarks || "",
      fromTime: formValue.timeFrom || "",
      toTime: formValue.timeTo || "",
      apmT_Type: "A"
    };
    this.isSaving = true;

    this.appointmentDeliveryService.addEditAppointment(payload, this.commonService.globalFilters.UserID.toString()).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res && res.success) {
          const apmtNo = res.data?.appointmentNo || '';
          const msg = res.data?.tranXaction || 'Appointment saved successfully!';
          const msgHtml = `<b>${msg}</b><br/><br/>Appointment ID: <span style="color:#CC0000; font-weight:bold;">${apmtNo}</span>`;

          this.sweetAlertService.success(msgHtml).then(() => {
            this.onSaved.emit();
            this.closeModal();
          });
        } else {
          this.sweetAlertService.error(res?.message || '');
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving appointment', err);
        const errorMsg = err?.error?.data?.message || err?.error?.message || err?.message || '';
        this.sweetAlertService.error(errorMsg);
      }
    });
  }

  fetchDocketDetails() {
    const docketNo = this.appointmentForm.get('docketNo')?.value;
    const entryType = this.appointmentForm.get('entryType')?.value || '';
    if (!docketNo) {
      this.docketEligibilityError = '';
      return;
    }

    this.isDocketLoading = true;
    this.docketEligibilityError = '';

    // First check eligibility
    this.appointmentDeliveryService.checkDeliveryEligibility(docketNo, entryType).subscribe({
      next: (eligibilityRes: any) => {
        if (eligibilityRes && eligibilityRes.success && eligibilityRes.data) {
          if (eligibilityRes.data.status === 'Error') {
            this.isDocketLoading = false;
            this.docketEligibilityError = eligibilityRes.data.message;
            return; // Stop execution, do not fetch docket details
          }
        }

        // If eligible, fetch details
        this.complaintService.getDocDataDetail(docketNo).subscribe({
          next: (res) => {
            this.isDocketLoading = false;
            if (res && res.data) {
              const origin = res.data.origin || '';
              const dest = res.data.destination || '';
              const orgDest = origin && dest ? `${origin} / ${dest}` : (origin || dest || '');

              this.appointmentForm.patchValue({
                orgDest: orgDest,
                currentStatus: res.data.currentStatus || '',
                docketDate: res.data.documentDate || '',
                edd: res.data.edd || '',
                consigneeName: res.data.customerName || '',
                consigneeEmail: res.data.customerEmail || '',
                consigneeContact: res.data.contactno || '',
                consigneeAddress: res.data.csAddress || '',
                originCode: res.data.originCode || '',
                desitnationCode: res.data.desitnationCode || ''
              });
            }
          },
          error: (err) => {
            this.isDocketLoading = false;
            console.error('Error fetching docket details', err);
          }
        });
      },
      error: (err: any) => {
        this.isDocketLoading = false;
        console.error('Error checking eligibility', err);
      }
    });
  }
}
