import { DatePipe, CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  inject
} from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  EmailRegex,
  MobileRegex,
  todayDate,
} from '../../../shared/constants/common';
import { GeneralMasterResponse } from '../../../shared/models/external.model';
import { CityResponse, LeadResponse } from '../../../shared/models/lead.model';
import {
  LocationResponse,
  UserResponse,
} from '../../../shared/models/meeting.model';
import { CommonService } from '../../../shared/services/common.service';
import { ExternalService } from '../../../shared/services/external.service';
import { IdentityService } from '../../../shared/services/identity.service';
import { LeadService } from '../../../shared/services/lead.service';
import { MeetingService } from '../../../shared/services/meeting.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-add-lead',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, BsDatepickerModule],
  templateUrl: './add-lead.html',
  styleUrl: './add-lead.scss',
  providers: [BsModalService]
})
export class AddLead {
  public leadForm!: FormGroup;
  public leadId: string = '';
  public users: UserResponse[] = [];
  public leadCategories: GeneralMasterResponse[] = [];
  public leadSources: GeneralMasterResponse[] = [];
  public industryTypes: GeneralMasterResponse[] = [];
  public designations: GeneralMasterResponse[] = [];
  public serviceInterests: GeneralMasterResponse[] = [];
  public branches: LocationResponse[] = [];
  public cities: CityResponse[] = [];
  public regions: LocationResponse[] = [];
  public isSubmitting: boolean = false;
  public modalRef!: BsModalRef;
  @ViewChild('Templatepod', { static: true }) Templatepod!: TemplateRef<any>;
  @Input() leadResponse: LeadResponse | null = null;
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter<string>();

  private leadService = inject(LeadService);
  private externalService = inject(ExternalService);
  public commonService = inject(CommonService);
  private toasterService = inject(ToastrService);
  private identityService = inject(IdentityService);
  private meetingService = inject(MeetingService);
  private modalService = inject(BsModalService);

  constructor() {
    this.leadForm = new FormGroup({});
  }
  showPopup(lead: any) {
    this.buildForm();
    this.getIndustryTypes();
    this.getLeadSources();
    this.getLeadCategories();
    this.getServiceInterests();
    this.getDesignations();
    this.getLocations();
    this.getCities();
    this.getUsers();
    if (lead) {

      this.leadForm.patchValue({
        leadCategoryId: lead.leadCategoryId?.toString(),
        LeadDate: lead.leadDate,
        companyName: lead.companyName,
        contactName: lead.contactName,
        contactNo: lead.contactNo,
        address: lead.address,
        email: lead.email,
        cityId: lead.cityId,
        BranchId: lead.branchId,
        RegionId: lead.regionId,
        designationId: lead.designationId,
        LeadSourceId: lead.leadSourceId,
        assignedToId: lead.assignedToId,
        industryTypeId: lead.industryTypeId,
        ServiceInterestedIDs: lead.serviceInteresteds ? lead.serviceInteresteds.toString().split(',') : [],
        isActive: lead.isActive
      });
      this.leadId = lead.leadId;
    } else {
      this.leadId = '';
    }
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered', backdrop: true });
  }

  buildForm(): void {
    const today = new Date();
    const todayDateFormatted =
      String(today.getDate()).padStart(2, '0') + '/' +
      String(today.getMonth() + 1).padStart(2, '0') + '/' +
      today.getFullYear();

    let branchCode = this.identityService.getBranchCode();
    let storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('loginUser') : null;
    let parsedUser = JSON.parse(storedUser || '{}');

    this.leadForm = new FormGroup({
      leadCategoryId: new FormControl('1', [Validators.required]),
      LeadDate: new FormControl(todayDateFormatted, [Validators.required]),
      companyName: new FormControl('', [Validators.required]),
      contactName: new FormControl(null, [Validators.required]),
      contactNo: new FormControl(null, [
        Validators.required,
        Validators.pattern(MobileRegex),
      ]),
      address: new FormControl(null),
      email: new FormControl(null, [
        Validators.required,
        Validators.pattern(EmailRegex),
      ]),
      cityId: new FormControl(null),
      BranchId: new FormControl(branchCode),
      RegionId: new FormControl(parsedUser.reportingLoc),
      designationId: new FormControl(parsedUser.designationId),
      LeadSourceId: new FormControl(null),
      assignedToId: new FormControl(null),
      industryTypeId: new FormControl(null),
      ServiceInterestedIDs: new FormControl([], [Validators.required]),
      isActive: new FormControl(true),
    });
  }

  formatDate(dateString: any): string {
    if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') {
      return '';
    }
    const [datePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) {
      return '';
    }
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  onClose() {
    this.leadForm.reset();
    this.buildForm();
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  closeModal() {
    this.onClose();
  }

  onSubmitLead(form: FormGroup): void {
    if (form.valid) {
      this.isSubmitting = true;
      let assignedTo = this.identityService.getLoggedUserId();
      const dataToSubmit = {
        ...form.value,
        LeadDate: this.formatDate(form.value.LeadDate),
        ServiceInterestedIDs: form.value.ServiceInterestedIDs.join(','),
        CreatedBy: assignedTo,
        leadCategoryId: parseInt(form.value.leadCategoryId),
        companyName: form.value.companyName.toUpperCase()
      };
      !this.leadId ? this.addLead(dataToSubmit) : this.updateLead(dataToSubmit);
    } else {
      this.leadForm.markAllAsTouched();
    }
  }

  getCities() {
    this.externalService.getCities().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.cities = response.data.map((user: any) => ({
            city_code: user.city_code,
            location: `${user.city_code} : ${user.location}`,
          }));
        }
      },
      error: (err) => console.error(err)
    });
  }

  getDesignations(searchText: string | null = null) {
    return this.externalService.getGeneralMaster(searchText, 'DESIG').subscribe({
      next: (response) => {
        if (response && response.data) {
          this.designations = response.data;
        }
      },
      error: (err) => console.error(err)
    });
  }

  getIndustryTypes(searchText: string | null = null) {
    return this.externalService.getGeneralMaster(searchText, 'IND').subscribe({
      next: (response) => {
        if (response && response.data) {
          this.industryTypes = response.data;
        }
      },
      error: (err) => console.error(err)
    });
  }

  getLeadCategories(searchText: string | null = null) {
    this.externalService.getGeneralMaster(searchText, 'LEADCAT').subscribe({
      next: (response) => {
        if (response && response.data) {
          this.leadCategories = response.data;
        }
      },
      error: (err) => console.error(err)
    });
  }

  getLeadSources(searchText: string | null = null) {
    return this.externalService.getGeneralMaster(searchText, 'LEADSRC').subscribe({
      next: (response) => {
        if (response && response.data) {
          this.leadSources = response.data.map((user: any) => ({
            codeId: user.codeId,
            codeDesc: `${user.codeId} : ${user.codeDesc}`,
            codeType: user.codeType
          }));
        }
      },
      error: (err) => console.error(err)
    });
  }

  getServiceInterests(searchText: string | null = null) {
    this.externalService.getGeneralMaster(searchText, 'FLTPROD').subscribe({
      next: (response) => {
        if (response && response.data) {
          this.serviceInterests = response.data;
        }
      },
      error: (err) => console.error(err)
    });
  }

  getUsers() {
    this.meetingService.getAssignedTo().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.users = response.data;
        }
      },
      error: (err) => console.error(err)
    });
  }

  getLocations() {
    this.externalService.getLocationMaster().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.branches = response.data.map((user: any) => ({
            locCode: user.locCode,
            locName: `${user.locCode} : ${user.locName}`,
          }));
          this.regions = response.data.map((user: any) => ({
            locCode: user.locCode,
            locName: `${user.locCode} : ${user.locName}`,
          }));
        }
      },
      error: (err) => console.error(err)
    });
  }

  addLead(dataToSubmit: any): void {
    this.leadService.addLead(dataToSubmit).subscribe({
      next: (response) => {
        if (response.success) {
          this.toasterService.success(response.data.message);
          this.dataEmitter.emit();
          this.leadForm.reset();
          this.buildForm();
          this.closeModal();
        } else {
          this.toasterService.error(response.error.message);
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
      },
    });
  }

  updateLead(dataToSubmit: any): void {
    this.leadService.updateLead(this.leadId, dataToSubmit).subscribe({
      next: (response) => {
        if (response.success) {
          this.toasterService.success(response.data.message);
          this.dataEmitter.emit();
          this.leadForm.reset();
          this.closeModal();
        } else {
          this.toasterService.error(response.error.message);
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
      },
    });
  }
}
