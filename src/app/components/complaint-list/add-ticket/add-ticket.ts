import { Component, EventEmitter, inject, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IdentityService } from '../../../shared/services/identity.service';
import { CommonService } from '../../../shared/services/common.service';
import { ExternalService } from '../../../shared/services/external.service';
import { ToastrService } from 'ngx-toastr';
import { GeneralMasterResponse } from '../../../shared/models/external.model';
import { ComplaintService } from '../../../shared/services/complaint.service';
import { AssignToList, ComplaintGetUser, TicketAddressToResponse } from '../../../shared/models/complaint.model';
import { UserResponse } from '../../../shared/models/meeting.model';
import { MultipleEmailRegex } from '../../../shared/constants/common';
import { debounceTime, distinctUntilChanged, filter, Subject } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { NgSelectModule } from '@ng-select/ng-select';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-add-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, BsDatepickerModule],
  templateUrl: './add-ticket.html',
  styleUrl: './add-ticket.scss',
  providers: [DatePipe]
})
export class AddTicket {
  public ticketTypes: GeneralMasterResponse[] = [];
  public ticketSubTypes: GeneralMasterResponse[] = [];
  public priorities: GeneralMasterResponse[] = [];
  public ticketSources: GeneralMasterResponse[] = [];
  public enquiryCategories: GeneralMasterResponse[] = [];
  public users: UserResponse[] = [];
  public ticketForm!: FormGroup;
  public escalationForm!: FormGroup;
  public docketNotFound = false;
  public emails: string[] = [];
  public escEmail: string[] = [];
  public emailInput: string = '';
  public emailError: boolean = false;
  public locations: TicketAddressToResponse[] = [];
  public userList!: ComplaintGetUser;
  public selectedFile: File | null = null;
  public assignToList: AssignToList[] = []
  private docketNoSubject = new Subject<string>();
  public loading: boolean = false;
  public modalRef!: BsModalRef;
  public isLoading: boolean = false;
  public complaint: string = ''
  minDate!: Date;
  datepickerMDY: any;

  public modalService = inject(BsModalService);

  @ViewChild('Templatepod') Templatepod!: TemplateRef<any>;
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter<string>();

  showPopupAddTicket(apiCall?: () => any) {
    this.isLoading = true;
    this.modalRef = this.modalService.show(this.Templatepod, { class: 'modal-lg modal-dialog-centered modal-width', backdrop: true });
    this.buildForm();
    this.getTicketTypes();
    this.getEnquiryCategories();
    this.getticketSources()
    this.getPriorities();
    this.getUsers();
    this.createEscalationForm();
    this.getLocations();
    if (apiCall) {
      // Execute API call for Edit/Close/Escalation
      apiCall().subscribe({
        next: (response: any) => {
          const ComplaintResponse = response?.data;
          this.getComplaintGetUser();
          if (ComplaintResponse) {
            this.isLoading = false;
            const assignedTo = this.users.filter(d => d.name === ComplaintResponse.assignedTo)
            if (ComplaintResponse.documentNo) {
              this.loading = true;
              this.onDocketNo(ComplaintResponse.documentNo);
            }
            let customerEmail = ComplaintResponse.customerEmail ? ComplaintResponse.customerEmail.split(';').map((email: string) => email.trim()) : [];
            if (this.complaint !== 'Escalation') { this.getAssignTo(ComplaintResponse?.ticketAddressToId) } else { this.getAssignTo('') }
            this.getTicketSubTypes(ComplaintResponse.type);
            this.ticketForm.patchValue({
              userID: ComplaintResponse.userID,
              docketNo: ComplaintResponse.documentNo,
              complaintId: ComplaintResponse.complaintID,
              source: ComplaintResponse.source.toString(),
              priority: ComplaintResponse.priority.toString(),
              ticketDate: ComplaintResponse.compalaintDate,
              description: ComplaintResponse.description,
              type: ComplaintResponse.type.toString(),
              // customerEmail:[customerEmail],
              subType: ComplaintResponse.subType.toString(),
              complaintDate: ComplaintResponse.compalaintDate ? ComplaintResponse.compalaintDate : this.minDate,
              updateDate: new Date(),
              // updateRemarks:ComplaintResponse.updateRemark === '-' ? '':ComplaintResponse.updateRemark,
              assignedToId: ComplaintResponse?.assignToId,
              remarks: ComplaintResponse.remarks,
              ticketAddressTo: ComplaintResponse.ticketAddressToId,
              customerID: ComplaintResponse.customerID
            })
            if (this.complaint === 'Update') {
              this.ticketForm.get('updateRemarks')?.setValidators([Validators.required]);
            } else {
              this.ticketForm.get('updateRemarks')?.clearValidators();
            }

            // Refresh validation status
            this.ticketForm.get('updateRemarks')?.updateValueAndValidity();
            this.emails = [...customerEmail];
            this.createEscalationForm(ComplaintResponse);
          } else {
            this.buildForm();
          }
        },
        error: (response: any) => {
          this.isLoading = false;
          this.onClose();
        },
      });
    } else {
      // For New Ticket - no API call needed
      this.getComplaintGetUser();
      this.isLoading = false;
    }
  }

  constructor(
    public identityService: IdentityService,
    public commonService: CommonService,
    public externalService: ExternalService,
    private datePipe: DatePipe,
    public toasterService: ToastrService,
    private complaintService: ComplaintService,) {
    this.docketNoSubject.pipe(debounceTime(100), distinctUntilChanged(), filter(value => value.length >= 2)).subscribe(docketNo => {
      this.loading = true;
      this.onDocketNo(docketNo);
    });
  }

  formatDate(dateString: string | null | undefined): string | null {
    if (!dateString || dateString === '-' || dateString.trim() === '') {
      return null; // Handle invalid values safely
    }
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      return null; // Return null if parsing fails
    }
    return this.datePipe.transform(parsedDate, 'dd/MM/yyyy');
  }

  ngOnInit() {

    // this.getAssignTo();
  }

  onClose() {
    this.emails = [];
    this.ticketForm.reset();
    this.buildForm();
    if (this.modalRef) {
      this.modalRef.hide();
    }
    this.ticketForm.patchValue({
      managerName: this.userList.complaintManagerName,
      managerId: this.userList.complaintManagerID,
      userName: this.userList.userName,
      userID: this.userList.userId,
    });
  }
  onEscalationClose() {
    this.escalationForm.reset();
    this.createEscalationForm();
    this.escEmail = [];
    this.emails = [];
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }
  buildForm(): void {
    this.minDate = new Date();
    let assignedTo = this.identityService.getLoggedUserId();
    this.ticketForm = new FormGroup({
      userID: new FormControl(assignedTo),
      docketNo: new FormControl('', [Validators.required]),
      origin: new FormControl(''),
      userName: new FormControl(assignedTo),
      docDate: new FormControl(''),
      destination: new FormControl(''),
      managerId: new FormControl(''),
      EDD: new FormControl(''),
      ticketAddressTo: new FormControl(null, Validators.required),
      managerName: new FormControl(''),
      billingParty: new FormControl(''),
      currentStatus: new FormControl(''),
      source: new FormControl(null, [Validators.required]),
      priority: new FormControl(null, [Validators.required]),
      complaintDate: new FormControl(this.minDate, [Validators.required]),
      description: new FormControl('', [Validators.required]),
      type: new FormControl(null, [Validators.required]),
      customerEmail: new FormControl('', []),
      subType: new FormControl(null, [Validators.required]),
      browse: new FormControl(''),
      updateDate: new FormControl(new Date()),
      updateRemarks: new FormControl(''),
      assignedToId: new FormControl([], [Validators.required]),
      complaintId: new FormControl(''),
      remarks: new FormControl(''),
      closeBy: new FormControl(assignedTo),
      closeRemark: new FormControl(''),
      customerID: new FormControl(''),
      closureDate: new FormControl(new Date()),
      currentLocation: new FormControl(''),
      moduleType: new FormControl(null),
      // enquiryCategories: new FormControl(null),
    });

    this.ticketForm.get('complaintDate')?.valueChanges.subscribe(() => this.checkTicketCategory());
    this.ticketForm.get('EDD')?.valueChanges.subscribe(() => this.checkTicketCategory());
  }

  checkTicketCategory() {
    const eddStr = this.ticketForm.get('EDD')?.value;
    const tktDate = this.ticketForm.get('complaintDate')?.value;

    if (eddStr && tktDate) {
      const edd = new Date(eddStr);
      let ticketDate: Date;
      if (tktDate instanceof Date) {
        ticketDate = tktDate;
      } else if (tktDate && typeof tktDate === 'object' && tktDate.year) {
        ticketDate = new Date(tktDate.year, tktDate.month - 1, tktDate.day);
      } else {
        ticketDate = new Date(tktDate);
      }

      if (!isNaN(edd.getTime()) && !isNaN(ticketDate.getTime())) {
        edd.setHours(0, 0, 0, 0);
        ticketDate.setHours(0, 0, 0, 0);

        if (ticketDate > edd) {
          this.ticketForm.get('moduleType')?.setValue('C');
        } else {
          this.ticketForm.get('moduleType')?.setValue('E');
        }
      }
    }
  }

  createEscalationForm(data?: any) {
    let assignedTo = this.identityService.getLoggedUserId();
    let existingEmails = data?.escEmailId ? data.escEmailId.split(';').map((email: string) => email.trim()) : [];
    this.escalationForm = new FormGroup({
      complaintId: new FormControl(data?.complaintID),
      docketNo: new FormControl(data?.documentNo),
      type: new FormControl(data?.type.toString()),
      description: new FormControl(data?.description),
      assigned: new FormControl(data?.assignToId),
      status: new FormControl(data?.compaintStatus),
      priority: new FormControl(data?.priority.toString()),
      escalatedTo: new FormControl(data?.escalationTo ? data.escalationTo.split(',') : [], [Validators.required]),
      escalatedEmail: new FormControl(),
      escalatedDate: new FormControl(new Date(), [Validators.required]),
      escalatedRemarks: new FormControl('', [Validators.required]),
      documents: new FormControl(''),
      userID: new FormControl(assignedTo),
    });
    this.escEmail = [...existingEmails];
  }

  convertToFormattedDate(dateStr: string): string | null {
    if (!dateStr) return null;
    let dateParts = dateStr.split(" ")[0].split("/");
    if (dateParts.length !== 3) return null;
    let month = Number(dateParts[0]); // MM
    let day = Number(dateParts[1]);   // DD
    let year = Number(dateParts[2]);  // YYYY
    return `${this.padZero(day)}/${this.padZero(month)}/${year}`;
  }
  padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.key === ';') {
      this.addEmail();
    }
  }

  onEscKeyUp(event: KeyboardEvent) {
    if (event.key === ';') {
      this.addEscEmail();
    }
  }

  addEmail() {
    let emailList = this.ticketForm.value.customerEmail
      .split(';')
      .map((email: any) => email.trim())
      .filter((email: any) => email);

    emailList.forEach((email: any) => {
      if (MultipleEmailRegex.test(email) && !this.emails.includes(email)) {
        this.emails.push(email);
        this.emailError = false;
      } else {
        this.emailError = true;
      }
    });

    this.ticketForm.get('customerEmail')?.setValue('');
  }

  addEscEmail() {
    let emailList = this.escalationForm.value.escalatedEmail
      .split(';')
      .map((email: any) => email.trim())
      .filter((email: any) => email);

    emailList.forEach((email: any) => {
      if (MultipleEmailRegex.test(email) && !this.escEmail.includes(email)) {
        this.escEmail.push(email);
        this.emailError = false;
      } else {
        this.emailError = true;
      }
    });

    this.escalationForm.get('escalatedEmail')?.setValue('');
  }


  removeEmail(index: number) {
    this.emails.splice(index, 1);
    this.ticketForm.get('customerEmail')?.setValue(this.emails.join(';'));
  }

  removeEscEmail(index: number) {
    this.escEmail.splice(index, 1);
    this.escalationForm.get('escalatedEmail')?.setValue(this.escEmail.join(';'));
  }

  onAssignToList(event: any) {
    if (event && event.length) {
      const emailIds = event.map((user: any) => user.emailId);
      this.escEmail = [];
      // this.escEmail.push(this.complaintResponse?.escEmailId)
      emailIds.forEach((email: any) => {
        if (MultipleEmailRegex.test(email) && !this.escEmail.includes(email)) {
          this.escEmail.push(email);
          this.emailError = false;
        } else {
          this.emailError = true;
        }
      });
    } else {
      this.escEmail = [];
    }
  }

  onDocketNoChange(event: any) {
    const docketNo = event.target.value;
    this.docketNoSubject.next(docketNo);
  }
  setDefaultDate() {
    const today = new Date();
    const todayDate = {
      year: today.getFullYear(),
      month: today.getMonth() + 1, // NgbDateStruct uses 1-based months
      day: today.getDate(),
    };

    this.ticketForm.get('complaintDate')?.setValue(todayDate);
  }

  onDocketNo(docketNo: string) {
    this.loading = true;
    this.complaintService.getDocDataDetail(docketNo).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.ticketForm.patchValue({
            origin: response.data.origin,
            destination: response.data.destination,
            docDate: response.data.documentDate,
            EDD: response.data.edd,
            billingParty: response.data.customerName,
            currentStatus: response.data.currentStatus,
            currentLocation: response.data.currentLocation
          });
          this.loading = false;
        }
      },
      error: (error: any) => {
        this.loading = false;
      },
    });
  }

  getLocations() {
    this.complaintService.getTicketAddressTo().subscribe({
      next: (response) => {
        if (response) {
          this.locations = response.data.map((user: any) => ({
            locCode: user.locCode,
            locName: `${user.locCode}: ${user.locName}`,
          }));
        }
      },
      error: (response: any) => {
        this.toasterService.error(response);
      },
    });
  }

  getAssignTo(locCode: string) {
    this.ticketForm.patchValue({
      assignedToId: null
    })
    this.complaintService.getAssignTo(locCode).subscribe({
      next: (response) => {
        if (response) {
          // this.assignToList = response.data;
          this.assignToList = response.data.map((user: any) => ({
            userId: user.userId,
            userName: `${user.userId}: ${user.userName}`,
            emailId: user.emailId
          }));
        }
      },
      error: (response: any) => {
        this.toasterService.error(response);
      },
    });
  }

  getComplaintGetUser() {
    this.complaintService.getComplaintGetUser(this.identityService.getLoggedUserId()).subscribe({
      next: (response) => {
        if (response.success) {
          this.userList = response.data
          this.ticketForm.patchValue({
            managerName: this.userList.complaintManagerName,
            managerId: this.userList.complaintManagerID,
            userName: this.userList.userName,
            userID: this.userList.userId,
          });
        }
      },
      error: (response: any) => {
        this.toasterService.error(response.error.message);
      },
    });
  }

  success(message: string, id: string): Promise<any> {
    return Swal.fire({
      title: `ID : ${id}`,
      html: `<div>${message}</div>`,
      icon: 'success',
      iconColor: '#7066e0'
    });
  }

  onSubmitTicket() {
    if (this.ticketForm.valid) {
      this.isLoading = true;
      if (this.complaint === 'Update') {
        const { customerID, closeDate, closeRemark, closureDate, docketNo, complaintDate, currentLocation, customerEmail, document, documentNo, priority, assignedToId, source, subType, type, closeBy, billingParty, browse, currentStatus, destination, docDate, EDD, managerId, managerName, origin, userName, ...update } = this.ticketForm.value;
        update.documentNo = this.ticketForm.value.docketNo,
          update.assignedToId = this.ticketForm.value.assignedToId,
          update.CustomerEmail = this.emails.join(';'),
          update.updateDate = this.datePipe.transform(this.ticketForm.value.updateDate, 'dd/MM/yyyy') || '';
        update.document = 'docket',
          this.updateTicket(update)
      } else if (this.complaint === 'Add') {
        const { customerID, closeDate, closeRemark, closureDate, userID, subType, type, docketNo, source, priority, description, customerEmail, closeBy, browse, assignedToId, remarks, complaintId, updateRemarks, updateDate, billingParty, destination, docDate, EDD, managerId, managerName, origin, userName, ...data } = this.ticketForm.value;
        data.DocumentNo = this.ticketForm.value.docketNo,
          data.Document = this.ticketForm.value.browse,
          data.AssignedTo = this.ticketForm.value.assignedToId,
          data.CustomerEmail = this.emails.join(';'),
          data.Description = this.ticketForm.value.description,
          data.Priority = this.ticketForm.value.priority,
          data.Source = this.ticketForm.value.source,
          data.SubType = this.ticketForm.value.subType,
          data.Type = this.ticketForm.value.type,
          data.UserID = this.ticketForm.value.userID,
          data.moduleType = this.ticketForm.getRawValue().moduleType;
        // data.complaintDate =  this.datePipe.transform(this.ticketForm.value.complaintDate, 'dd/MM/yyyy') || '';  
        this.addTicket(data);
      } else if (this.complaint === 'Close') {
        const close = {
          ComplaintID: this.ticketForm.value.complaintId,
          CloseBy: this.ticketForm.value.closeBy,
          CloseRemark: this.ticketForm.value.closeRemark,
          CustomerEmail: this.emails.join(';'),
          // closureDate:this.ticketForm.value.closureDate
        }
        this.closeTicket(close)
      }
    } else {
      this.ticketForm.markAllAsTouched()
    }
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0]; // Store the selected file
    }
  }
  addTicket(dataToSubmit: any) {
    this.complaintService.addComplaint(dataToSubmit).subscribe({
      next: (response) => {
        if (response.success) {
          // this.toasterService.success(response.data.message);
          this.success(response.data.message, response.data.id)
          this.dataEmitter.emit();
          this.onClose();
        } else {
          this.toasterService.error(response.error.message);
        }
        this.isLoading = false;
      },
      error: (response: any) => {
        this.toasterService.error(response.error.message);
        this.isLoading = false;
      },
    });
  }

  closeTicket(dataToSubmit: any) {
    this.complaintService.closeTicket(dataToSubmit).subscribe({
      next: (response) => {
        if (response.success) {
          this.toasterService.success(response.data.message);
          this.dataEmitter.emit();
          this.onClose();
        } else {
          this.toasterService.error(response.error.message);
        }
        this.isLoading = false;
      },
      error: (response: any) => {
        this.toasterService.error(response.error.message);
        this.isLoading = false;
      },
    });
  }

  updateTicket(dataToSubmit: any): void {
    this.complaintService
      .updateComplaint(this.ticketForm.value.complaintId, dataToSubmit)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // this.toasterService.success(response.data.message);
            this.success(response.data.message, response.data.id)
            this.dataEmitter.emit();
            this.onClose();
          } else {
            this.toasterService.error(response.error.message);
          }
          this.isLoading = false;
        },
        error: (response: any) => {
          this.toasterService.error(response.error.message);
          this.isLoading = false;
        },
      });
  }

  escalationTicket() {
    const { priority, status, assigned, description, type, docketNo, ...data } = this.escalationForm.value;
    data.escalatedEmail = this.escEmail.join(';')
    data.escalatedTo = this.escalationForm.value.escalatedTo.map((user: any) => user).join(',');
    data.escalatedDate = this.datePipe.transform(this.escalationForm.value.escalatedDate, 'dd/MM/yyyy') || '';
    this.isLoading = true;
    this.complaintService.AddEscTktComplaint(data).subscribe({
      next: (response) => {
        if (response.success) {
          // this.toasterService.success(response.data.message);
          this.success(response.data.message, response.data.id)
          this.dataEmitter.emit();
          this.onEscalationClose()
        } else {
          this.toasterService.error(response.error.message);
        }
        this.isLoading = false;
      },
      error: (response: any) => {
        this.toasterService.error(response.error.message);
        this.isLoading = false;
      },
    });
  }

  getTicketTypes(searchText: string | null = null) {
    this.externalService.getGeneralMaster(searchText, 'CMPLNTYPE').subscribe({
      next: (response) => {
        if (response) {
          this.ticketTypes = response.data;
        }
      },
      error: (response: any) => {
        this.toasterService.error(response);
      },
    });
  }

  getEnquiryCategories(searchText: string | null = null) {
    this.externalService.getGeneralMaster(searchText, 'ENQCAT').subscribe({
      next: (response) => {
        if (response) {
          this.enquiryCategories = response.data;
        }
      },
      error: (response: any) => {
        this.toasterService.error(response);
      },
    });
  }

  getTicketSubTypes(event: any) {
    this.ticketForm.patchValue({
      subType: null
    })
    this.complaintService.getTicketSubType(event).subscribe({
      next: (response) => {
        if (response) {
          this.ticketSubTypes = response.data;
        }
      },
      error: (response: any) => {
        this.toasterService.error(response);
      },
    });
  }

  getPriorities(searchText: string | null = null) {
    return this.externalService
      .getGeneralMaster(searchText, 'PRIORITY')
      .subscribe({
        next: (response) => {
          if (response) {
            this.priorities = response.data;
          }
        },
        error: (response: any) => {
          this.toasterService.error(response);
        },
      });
  }

  getticketSources(searchText: string | null = null) {
    return this.externalService
      .getGeneralMaster(searchText, 'LEADSRC')
      .subscribe({
        next: (response) => {
          if (response) {
            this.ticketSources = response.data;
          }
        },
        error: (response: any) => {
          this.toasterService.error(response);
        },
      });
  }

  getUsers() {
    this.externalService.getUserMaster().subscribe({
      next: (response) => {
        if (response) {
          this.users = response.data;
        }
      },
      error: (response: any) => {
        this.toasterService.error(response);
      },
    });
  }
}
