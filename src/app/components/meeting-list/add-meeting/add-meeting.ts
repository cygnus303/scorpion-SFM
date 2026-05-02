import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonService } from '../../../shared/services/common.service';
import {
  EmailRegex,
  MobileRegex,
} from '../../../shared/constants/common';
import { ToastrService } from 'ngx-toastr';
import {
  AddMeetingResponse,
  LocationResponse,
  MeetingMoMResponse,
  MeetingResponse,
  UserResponse,
} from '../../../shared/models/meeting.model';
import { MeetingService } from '../../../shared/services/meeting.service';
import { CustomerDetailResponse, LeadCustomerResponse } from '../../../shared/models/customer.model';
import { LeadContactResponse } from '../../../shared/models/lead.model';
import { GeneralMasterResponse } from '../../../shared/models/external.model';
import { ExternalService } from '../../../shared/services/external.service';
import { CustomerService } from '../../../shared/services/customer.service';
import { CalendarService } from '../../../shared/services/calendar.service';
import { CalendarResponse } from '../../../shared/models/calendar.model';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IdentityService } from '../../../shared/services/identity.service';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-add-meeting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    BsDatepickerModule,
    ModalModule,
    GoogleMapsModule
  ],
  templateUrl: './add-meeting.html',
  styleUrls: ['./add-meeting.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AddMeeting implements OnInit, OnDestroy {
  public meetingForm!: FormGroup;
  public meetingId: string = '';
  public attendeeId: string = '';
  public meetingTypes: GeneralMasterResponse[] = [];
  public users: UserResponse[] = [];
  public customers: LeadCustomerResponse[] = [];
  public leadContacts: LeadContactResponse[] = [];
  public locations: LocationResponse[] = [];
  meetingRole: boolean = false;
  public meetingMom: MeetingMoMResponse[] = [];
  public isChecked: boolean = false;
  meetingSubscription!: Subscription;
  public geoLocation: any;
  calendarOptions: CalendarResponse[] = [];
  public meetingCustomerList: any;
  public isSubmitting: boolean = false;
  public customerData!: CustomerDetailResponse;
  isCustomerLoading = false;
  public notCustomerNameValue = 'Please enter at least 3 characters';

  public modalRef!: BsModalRef;
  private modalService = inject(BsModalService);
  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;

  @Input() checkOutValue: any = '-';
  @Input() meetingResponse: MeetingResponse | null = null;
  @Input() addmeetingResponse: AddMeetingResponse | null = null;
  @Input() isMeetingList: string = 'Add';
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter<string>();

  center: any = {
    lat: 28.5578178,
    lng: 77.0627425,
  };
  DistanceInKM: any;
  zoom = 12;
  minDate: Date = new Date();

  constructor(
    private meetingService: MeetingService,
    private externalService: ExternalService,
    public customerService: CustomerService,
    public commonService: CommonService,
    private toasterService: ToastrService,
    private calendarService: CalendarService,
    private identityService: IdentityService,
    private sweetAlertService: SweetAlertService,
    public router: Router
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.meetingSubscription = this.meetingService.meetingResponseSubject.subscribe((res) => {
      if (res) {
        this.meetingForm.patchValue({ customerName: res.customerName || res.companyName, customerCode: res.customerCode });
        this.getCustomerDetail('', res.customerCode);
      }
    });
  }

  showPopup(meeting?: any) {
    this.meetingForm.reset();
    this.meetingId = '';
    this.isChecked = false;

    if (meeting) {
      this.patchFormValues(meeting);
      this.isMeetingList = 'Update';
    } else {
      this.isMeetingList = 'Add';
      this.meetingForm.patchValue({ CreateBy: this.identityService.getLoggedUserId(), isAllDayEvent: false });
    }
    this.getCustomers();
    this.getLocations();
    this.getMeetingTypes();
    this.getUsers();
    this.getCalendar();
    this.getMeetingMom();
    this.getCustomerList();

    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: 'static' });
  }

  patchFormValues(meeting: any) {
    this.meetingResponse = meeting;
    if (meeting.attendees) {
      meeting.attendeeIDs = meeting.attendees.split(',');
    }
    meeting.meetingMOM = meeting.meetingMOM ? meeting.meetingMOM.toString().split(',') : [];
    this.center.lat = meeting.latitude || 28.5578178;
    this.center.lng = meeting.longitude || 77.0627425;
    this.meetingId = meeting.meetingId;
    this.attendeeId = meeting.attendeeCode;

    this.meetingForm.patchValue({
      ...meeting,
      meetingTypeId: meeting.meetingTypeId?.toString()
    });

    this.updateRemarksValidator();
    this.getCustomerDetail('', meeting.customerCode);
    this.meetingRole = meeting.meetingRole === 'A' ? true : false;
  }

  updateRemarksValidator() {
    const remarksControl = this.meetingForm.get('remarks');
    const meetingMOMControl = this.meetingForm.get('meetingMOM');
    if (this.meetingId !== '' && this.checkOutValue !== '-') {
      remarksControl?.setValidators([Validators.required]);
      meetingMOMControl?.setValidators([Validators.required]);
    } else {
      remarksControl?.clearValidators();
      meetingMOMControl?.clearValidators();
    }
    remarksControl?.updateValueAndValidity();
    meetingMOMControl?.updateValueAndValidity();
  }

  buildForm(): void {
    this.meetingForm = new FormGroup({
      leadId: new FormControl(''),
      customerCode: new FormControl(''),
      customerName: new FormControl(''),
      contactName: new FormControl(null, [Validators.required]),
      contactNo: new FormControl(null, [
        Validators.required,
        Validators.pattern(MobileRegex),
      ]),
      email: new FormControl(null, [
        Validators.required,
        Validators.pattern(EmailRegex),
      ]),
      meetingPurpose: new FormControl(null, [Validators.required]),
      meetingDate: new FormControl(null, [Validators.required]),
      address: new FormControl(null, [Validators.required]),
      startTime: new FormControl(null, [Validators.required]),
      endTime: new FormControl(null, [Validators.required]),
      meetingTypeId: new FormControl(null, [Validators.required]),
      meetingLocation: new FormControl(null, [Validators.required]),
      isAllDayEvent: new FormControl(false),
      attendeeIDs: new FormControl([]),
      meetingMOM: new FormControl([]),
      geoLocation: new FormControl(null),
      latitude: new FormControl(null),
      longitude: new FormControl(null),
      checkInDateTime: new FormControl(null),
      checkOutDateTime: new FormControl(null),
      remarks: new FormControl(null),
      CreateBy: new FormControl(this.identityService.getLoggedUserId()),
      ModifiedBy: new FormControl(null),
      DistanceInKM: new FormControl(),
    });
    this.meetingForm.setValidators(this.checkDuplicateMeetingTimes.bind(this));
  }

  getCustomerDetail(event?: any, customerCode?: string) {
    if (event) {
      this.meetingForm.patchValue({ customerCode: event.customerCode });
    }
    const code = event ? event.customerCode : customerCode;
    if (code && code.length >= 3) {
      this.isCustomerLoading = true;
      this.customerService.getCustomerDetail(code).subscribe({
        next: (response) => {
          if (response.data && response.data[0]) {
            this.customerData = response.data[0];
            this.meetingForm.patchValue({
              contactName: this.customerData.ContactName,
              address: this.customerData.Address,
              contactNo: this.customerData.ContactNo,
              email: this.customerData.Email
            });
          } else {
            this.meetingForm.patchValue({
              contactName: '',
              address: '',
              contactNo: '',
              email: ''
            });
          }
          this.isCustomerLoading = false;
        },
        error: (err) => {
          this.toasterService.error(err);
          this.isCustomerLoading = false;
        },
      });
    }
  }

  checkDuplicateMeetingTimes(_control?: AbstractControl): ValidationErrors | null {
    if ((this.checkOutValue == '-' && !this.meetingId) || (this.checkOutValue == '-' && this.meetingId)) {
      const meetingDate = this.meetingForm.get('meetingDate')?.value;
      const startTime = this.meetingForm.get('startTime')?.value;
      const endTime = this.meetingForm.get('endTime')?.value;

      if (!meetingDate || !startTime || !endTime) return null;

      let formattedDate: string;
      if (meetingDate instanceof Date) {
        const d = meetingDate;
        formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        const dateParts = meetingDate.split('/');
        formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      }

      const today = new Date();
      const startDateTime = new Date(`${formattedDate}T${startTime}`);
      const endDateTime = new Date(`${formattedDate}T${endTime}`);

      if (startDateTime <= today) {
        return { startTimeAfterCurrentTime: true };
      } else if (endDateTime <= startDateTime) {
        return { timeRangeValidator: true };
      }
    }
    return null;
  }

  getMeetingMom() {
    this.meetingService.getMeetingMomDetails().subscribe({
      next: (response) => {
        if (response) this.meetingMom = response.data;
      }
    });
  }

  onClose() {
    this.modalRef.hide();
    this.buildForm();
  }

  onAllDayEventChange(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.isChecked = isChecked;
    if (isChecked) {
      this.meetingForm.patchValue({
        startTime: '10:00',
        endTime: '18:00'
      });
    } else {
      this.meetingForm.patchValue({
        startTime: '',
        endTime: ''
      });
    }
  }

  getCalendar() {
    const filter = { userId: this.identityService.getLoggedUserId() };
    this.calendarService.getCalendar(filter).subscribe({
      next: (response) => {
        if (response) this.calendarOptions = response.data;
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  onSubmitMeeting(form: FormGroup): void {
    // const leadId = this.customers.find((d)=>d.customerName === this.meetingForm.value.leadId)?.leadId
    if (this.customerService.customersList) {
      var customerCode = this.customerService.customersList.find((d) => d.customerName === form.value.customerName)?.customerCode
    }
    if (this.meetingResponse && this.meetingResponse.checkIn && this.meetingResponse.checkOut && this.meetingResponse.checkOutReason === 'CHECK OUT DONE') {
      const payload = {
        originLat: this.meetingResponse?.previousLatitude,
        originLng: this.meetingResponse?.previousLongitude,
        destLat: this.meetingResponse.latitude,
        destLng: this.meetingResponse.longitude
      }

      this.meetingService.getGoogleDetail(payload).subscribe({
        next: (response: any) => {
          if (response) {
            this.DistanceInKM = response.distanceKm
            this.meetingForm.patchValue({
              DistanceInKM: response.distanceKm
            });
          }
        }
      });
    }
    if (form.valid) {
      this.isSubmitting = true;
      const dataToSubmit = {
        ...form.value,
        attendeeIDs: form.value.attendeeIDs?.join(','),
        meetingMOM: form.value.meetingMOM?.join(','),
        meetingDate: this.formatDate(form.value.meetingDate),
        customerCode: form.value.customerCode ? form.value.customerCode : customerCode,
        leadId: form.value.leadId ? form.value.leadId : '',
        // isAllDayEvent:false
        CreateBy: this.identityService.getLoggedUserId(),
        DistanceInKM: this.DistanceInKM,
        ModifiedBy: this.isMeetingList === 'Update' ? this.identityService.getLoggedUserId() : ''
      };
      !this.meetingId ? this.addMeeting(dataToSubmit) : this.updateMeeting(dataToSubmit);

    } else {
      this.meetingForm.markAllAsTouched();
      this.logInvalidFieldNames(form);
    }
  }

  logInvalidFieldNames(form: FormGroup): void {
    const invalidFields = Object.keys(form.controls).filter((key) => {
      const control = form.get(key);
      return control && control.invalid;
    });
    if (invalidFields.length > 0) {
      console.log('Invalid fields:', invalidFields.join(', '));
    } else {
      console.log('No invalid fields.');
    }
  }

  updateMeeting(dataToSubmit: any): void {
    this.meetingService.updateMeeting(this.attendeeId, dataToSubmit).subscribe({
      next: (response) => {
        if (response.success) {
          this.dataEmitter.emit();
          this.sweetAlertService.success(response.data.message);
          this.onClose();
        } else {
          this.sweetAlertService.error(response.error.message);
        }
        this.isSubmitting = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response.error.message);
        this.isSubmitting = false;
      },
    });

  }


  addMeeting(dataToSubmit: any): void {
    this.meetingService.addMeeting(dataToSubmit).subscribe({
      next: (response) => {
        if (response.success) {
          this.dataEmitter.emit();
          this.sweetAlertService.success(response.data.message);
          this.onClose();
        } else {
          this.sweetAlertService.error(response.error.message);
        }
        this.isSubmitting = false;
      },
      error: (response: any) => {
        this.sweetAlertService.error(response.error.message);
        this.isSubmitting = false;
      },
    });
  }

  getMeetingTypes() {
    this.externalService.getGeneralMaster(null, 'METNGTYPE').subscribe({
      next: (response) => {
        if (response) this.meetingTypes = response.data;
      }
    });
  }

  getUsers() {
    this.meetingService.getAssignedTo().subscribe({
      next: (response) => {
        if (response) this.users = response.data;
      }
    });
  }

  getCustomers() {
    this.customerService.getLeadCustomerList().subscribe({
      next: (response) => {
        if (response) this.customers = response.data;
      }
    });
  }

  getLocations() {
    this.externalService.getLocationMaster().subscribe({
      next: (response) => {
        if (response) this.locations = response.data;
      }
    });
  }

  getGeoLocation(event: any) {
    const search = event.target.value;
    if (search?.length >= 3) {
      this.meetingService.getGeoLocationList(search).subscribe({
        next: (response) => {
          if (response) this.geoLocation = response.suggestions;
        }
      });
    }
  }

  getCustomerList(event?: any) {
    const searchTerm = event?.target?.value || '';
    if (searchTerm.length < 3) {
      this.meetingCustomerList = [];
      this.notCustomerNameValue = 'Enter at least 3 character';
      return;
    }
    this.notCustomerNameValue = 'Searching...';
    this.meetingService.getMeetingCustomer(this.identityService.getLoggedUserId(), searchTerm).subscribe({
      next: (response: any) => {
        if (response) {
          this.meetingCustomerList = response.data;
          this.notCustomerNameValue = response.data?.length ? '' : 'No items found';
        }
      }
    });
  }

  getLatLongData(event: any) {
    if (event) {
      this.meetingService.getLatLongAccordingAddress(event).subscribe({
        next: (response) => {
          if (response) {
            this.meetingForm.patchValue({
              longitude: response.longitude,
              latitude: response.latitude
            });
            this.center = { lat: response.latitude, lng: response.longitude };
          }
        }
      });
    }
  }

  resetMeetingDropdown() {
    this.meetingCustomerList = [];
    this.notCustomerNameValue = 'Please enter at least 3 characters';
  }

  ngOnDestroy(): void {
    if (this.meetingSubscription) {
      this.meetingSubscription.unsubscribe();
    }
  }
}
