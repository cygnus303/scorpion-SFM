import { Component, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalDirective, ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppointmentDeliveryService } from '../../../shared/services/appointment-delivery.service';
import { CommonService } from '../../../shared/services/common.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';

@Component({
  selector: 'app-reschedule-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalModule, BsDatepickerModule, NgSelectModule],
  templateUrl: './reschedule-appointment.html',
  styleUrls: ['./reschedule-appointment.scss']
})
export class RescheduleAppointment {
  activeType: string = '';
  reasonData:any;
  appointmentData: any = null;
  isLoading: boolean = false;
  isSaving: boolean = false;
  minAppointmentDate?: Date;

  private appointmentService = inject(AppointmentDeliveryService);
  public commonService = inject(CommonService);
  private sweetAlertService = inject(SweetAlertService);
    public expenseGeneralService=inject(ExpenseGeneralService)


  parseDate(dateStr: any): Date | null {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    if (typeof dateStr === 'string') {
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        if (day <= 31 && month >= 0 && month <= 11 && year > 1000) {
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) return date;
        }
      }
    }
    return null;
  }

  isDateLessThanEdd(): boolean {
    const eddStr = this.rescheduleForm.get('edd')?.value;
    const apmtDateObj = this.rescheduleForm.get('appointmentDate')?.value;
    
    if (!eddStr || !apmtDateObj) return false;

    const eddDate = this.parseDate(eddStr);
    const apmtDate = this.parseDate(apmtDateObj);

    if (eddDate && apmtDate) {
      eddDate.setHours(0, 0, 0, 0);
      apmtDate.setHours(0, 0, 0, 0);
      return apmtDate < eddDate;
    }
    return false;
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  @ViewChild('rescheduleModal') rescheduleModal!: ModalDirective;
  @Output() onUpdate = new EventEmitter<any>();

  rescheduleForm = new FormGroup({
    docketNo: new FormControl(''),
    docketDate: new FormControl(''),
    edd: new FormControl(''),
    docketStatus: new FormControl(''),

    appointmentDate: new FormControl('', Validators.required),
    timeFrom: new FormControl('', Validators.required),
    timeTo: new FormControl('', Validators.required),
    personName: new FormControl('', Validators.required),
    contactNo: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
    reschedule: new FormControl(null, Validators.required),
    appointmentRemarks: new FormControl('')
  });

  openModal(type: string, data: any) {
    this.activeType = type;
    this.appointmentData = data;
    this.rescheduleForm.reset();
     this.getReason('PRQRESCHEDULEREASON');


    const id = data?.appointmentNo || data?.csdNo || data?.msdNo || data?.id || '';

    const payload = {
      type: this.activeType,
      id: id
    };

    this.isLoading = true;
    this.appointmentService.getDeliveryAppointmentDetail(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.success && res.data) {
          const apiData = res.data;
          
          // Try to extract fromTime and toTime if appointmentTime is like "14:35 To 14:45"
          let timeFrom = '';
          let timeTo = '';
          if (apiData.appointmentTime) {
            const timeParts = apiData.appointmentTime.split(' To ');
            if (timeParts.length === 2) {
              timeFrom = timeParts[0].trim();
              timeTo = timeParts[1].trim();
            }
          }
          debugger
          let apmtDateRaw = apiData.appointmentDT || apiData.csdDate || apiData.msdDate || '';
          let parsedApmtDate = apmtDateRaw ? new Date(apmtDateRaw.split('-').reverse().join('-')) : '';

          const displayEdd = this.formatDisplayDate(apiData.edd || '');
          this.minAppointmentDate = this.parseDate(displayEdd) || undefined;

          this.rescheduleForm.patchValue({
            docketNo: apiData.dockno || '',
            docketDate: this.formatDisplayDate(apiData.cNoteDate || ''),
            edd: this.formatDisplayDate(apiData.edd || ''),
            docketStatus: apiData.currentStatus || '',
            
            appointmentDate: parsedApmtDate as any,
            personName: apiData.custnm || apiData.csgenm || '',
            contactNo: apiData.mobileno || apiData.csgeMobile || '',
            appointmentRemarks: apiData.apmtRemark || '',
            timeFrom: timeFrom,
            timeTo: timeTo,
            reschedule: apiData.reschedule || null,
          });
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error fetching details', err);
      }
    });

    this.rescheduleModal.show();
  }

   getReason(codeType: string) {
    this.expenseGeneralService.getGeneralMaster(codeType,'').subscribe({
      next: (response) => {
        if (response.success) {
          this.reasonData = response.data;
        }
      },
    });
  }

  closeModal() {
    this.rescheduleModal.hide();
  }

  onSubmit() {
    if (this.rescheduleForm.valid) {
      if (this.isDateLessThanEdd()) {
        const eddValue = this.rescheduleForm.get('edd')?.value;
        this.sweetAlertService.error(`Appointment Date cannot be earlier than EDD (${eddValue}).`);
        return;
      }

      const formValue = this.rescheduleForm.getRawValue();
      let appointmentDateIso = '';
      if (formValue.appointmentDate) {
        const d = new Date(formValue.appointmentDate);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        appointmentDateIso = `${year}-${month}-${day}T00:00:00.000Z`;
      }
debugger
      const payload = {
        appointmentNo: this.appointmentData?.appointmentNo || this.appointmentData?.id || "",
        dockno: formValue.docketNo || "",
        op_Status: formValue.docketStatus || "",
        csgecd: this.appointmentData?.orgncd || "",
        csgenm: formValue.personName || "",
        destcd: this.appointmentData?.destcd || "",
        appointment: appointmentDateIso,
        isEnabled: true,
        person: formValue.personName || "",
        mobile: formValue.contactNo || "",
        reschedule: formValue.reschedule || "",
        remark: formValue.appointmentRemarks || "",
        fromTime: formValue.timeFrom || "",
        toTime: formValue.timeTo || "",
        apmT_Type: "E"
      };

      this.isSaving = true;

      this.appointmentService.addEditAppointment(payload, this.commonService.globalFilters.UserID.toString()).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res && res.success) {
            const apmtNo = res.data?.appointmentNo || '';
            const msg = res.data?.tranXaction || 'Appointment rescheduled successfully!';
            const msgHtml = `<b>${msg}</b><br/><br/>Appointment ID: <span style="color:#CC0000; font-weight:bold;">${apmtNo}</span>`;
            
            this.sweetAlertService.success(msgHtml).then(() => {
              this.onUpdate.emit();
              this.closeModal();
            });
          } else {
            this.sweetAlertService.error('Failed to reschedule appointment: ' + (res?.message || 'Unknown error'));
          }
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error('Error rescheduling appointment', err);
          this.sweetAlertService.error('An error occurred while rescheduling the appointment.');
        }
      });
    } else {
      this.rescheduleForm.markAllAsTouched();
    }
  }
}
