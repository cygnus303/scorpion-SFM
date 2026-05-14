import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CommonService } from '../../../shared/services/common.service';
import { PrqService } from '../../../shared/services/prq-service';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { GeneralMaster } from '../../../shared/models/expenseGeneral.model';
import { DatePipe } from '@angular/common';
import { IdentityService } from '../../../shared/services/identity.service';
import Swal from 'sweetalert2';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-add-prq',
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, BsDatepickerModule],
  templateUrl: './add-prq.html',
  styleUrl: './add-prq.scss',
  providers: [DatePipe]
})
export class AddPrq {
  public modalRef!: BsModalRef;
  public PRQType: string = '';
  public emailData: any[] = [];
  public customerData: any[] = [];
  public searchSubject: Subject<string> = new Subject<string>();
  public customerSearchSubject: Subject<string> = new Subject<string>();
  public pincodeSearchSubject: Subject<string> = new Subject<string>();
  public destPincodeSearchSubject: Subject<string> = new Subject<string>();
  public prqForm!: FormGroup;
  public pincodeData: any[] = [];
  public destPincodeData: any[] = [];
  public productTypeData: GeneralMaster[] = [];
  public fleetTypeData: GeneralMaster[] = [];
  public vehicleCountList = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, text: (i + 1).toString() }));
  public serviceTypes = [
    { name: 'LTL', value: 'LTL' },
    { name: 'FTL', value: 'FTL' }
  ];
  @ViewChild('Templatepod', { static: true }) Templatepod!: TemplateRef<any>;
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter<string>();
  private modalService = inject(BsModalService);
  private prqService = inject(PrqService);
  private expenseGeneralService = inject(ExpenseGeneralService);
  private identityService = inject(IdentityService);
  private datePipe = inject(DatePipe);
  private sweetAlertService = inject(SweetAlertService);
  public commonService = inject(CommonService);

  ngOnInit(): void {
    this.initForm();
    // Email Search Subscription
    this.searchSubject.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((term: string) => {
      if (term?.trim()) {
        this.prqService.getEmailList(term).subscribe((res: any) => {
          this.emailData = res.data;
        });
      } else {
        this.emailData = [];
      }
    });

    // Customer Search Subscription
    this.customerSearchSubject.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((term: string) => {
      if (term?.trim() && term.length >= 3) {
        this.prqService.getCustomerList(term).subscribe((res: any) => {
          this.customerData = res.data;
        });
      } else {
        this.customerData = [];
      }
    });

    // Pincode Search Subscription
    this.pincodeSearchSubject.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((term: string) => {
      if (term?.trim() && term.length >= 3) {
        this.prqService.getCityPincodeDetails(term).subscribe((res: any) => {
          this.pincodeData = res.data;
        });
      } else {
        this.pincodeData = [];
      }
    });

    // Destination Pincode Search Subscription
    this.destPincodeSearchSubject.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((term: string) => {
      if (term?.trim() && term.length >= 3) {
        this.prqService.getCityPincodeDetails(term).subscribe((res: any) => {
          this.destPincodeData = res.data;
        });
      } else {
        this.destPincodeData = [];
      }
    });
  }

  showPopup(type?: string) {
    this.initForm();
    if (type === 'FTL') {
      this.getProductType(null);
      this.getFleetType(null);
      // Required validators for FTL
      this.prqForm.get('fleetType')?.setValidators([Validators.required]);
      this.prqForm.get('expMargin')?.setValidators([Validators.required]);
    } else {
      // Remove validators for LTL
      this.prqForm.get('fleetType')?.clearValidators();
      this.prqForm.get('expMargin')?.clearValidators();
    }
    this.prqForm.get('fleetType')?.updateValueAndValidity();
    this.prqForm.get('expMargin')?.updateValueAndValidity();
    if (type) {
      this.PRQType = type;
      this.prqForm.patchValue({ service_Type: type });
    }
    this.modalRef = this.modalService.show(this.Templatepod, { backdrop: 'static', class: 'modal-lg modal-dialog-centered' });
  }

  initForm() {
    this.prqForm = new FormGroup({
      indentNo: new FormControl(null),
      customerCode: new FormControl(null, Validators.required),
      loadingDate: new FormControl(new Date(), Validators.required),
      consignorNameAdd: new FormControl('', Validators.required), // Pickup Address
      unloadingContactNumber: new FormControl(''),

      pinCode: new FormControl(null, Validators.required), // Pickup Pin Code
      emailID: new FormControl(null, Validators.required),
      desPincode: new FormControl(null, Validators.required),
      consigneeNameAdd: new FormControl('', Validators.required), // Delivery Address
      approximateWeight: new FormControl(''),

      branchCode: new FormControl(''), // Pickup Branch
      customer_Name: new FormControl('', Validators.required),
      desBranchCode: new FormControl(''), // Destination Branch
      approximatePackages: new FormControl(''),
      shipmentNo: new FormControl(''),

      fromCity: new FormControl(''),
      fromCityCode: new FormControl(''),
      customer_KRM: new FormControl(''), // KAM
      service_Type: new FormControl('', Validators.required),
      loadingContactNumber: new FormControl(''),
      remarks: new FormControl(''),
      // Additional fields for FTL
      noOfVeh: new FormControl(null),
      expMargin: new FormControl(),
      expectedFreight: new FormControl(),
      expTruckHire: new FormControl(),
      fleetType: new FormControl(null),
      productType: new FormControl(null)
    });
  }

  onClose() {
    this.modalRef.hide();
    this.initForm();
  }

  getEmailList(event: any) {
    this.searchSubject.next(event.term);
  }

  getCustomerList(event: any) {
    this.customerSearchSubject.next(event.term);
  }

  getPincodeList(event: any) {
    this.pincodeSearchSubject.next(event.term);
  }

  getDestPincodeList(event: any) {
    this.destPincodeSearchSubject.next(event.term);
  }

  getProductType(searchText: string | null = null) {
    this.expenseGeneralService.getGeneralMaster(searchText, 'PROD').subscribe({
      next: (response: any) => {
        if (response) {
          this.productTypeData = response.data;
        }
      }
    });
  }

  getFleetType(searchText: string | null = null) {
    this.expenseGeneralService.getGeneralMaster(searchText, 'FTLTYP').subscribe({
      next: (response: any) => {
        if (response) {
          this.fleetTypeData = response.data;
        }
      }
    });
  }

  onChangeCustomer(event: any) {
    this.prqService.getCustomerDetails(event).subscribe((res: any) => {
      if (res.success && res.data && res.data.length > 0) {
        const detail = res.data[0];
        this.prqForm.patchValue({
          customer_Name: detail.custnm,
          customer_KRM: detail.name
        });
      }
    });
  }

  onChangePincode(event: any) {
    this.prqService.getBranchCityFromPincode(event).subscribe((res: any) => {
      if (res.success && res.data && res.data.length > 0) {
        const loc = res.data[0];
        this.prqForm.patchValue({
          branchCode: loc.branch,
          fromCity: loc.city,
          fromCityCode: loc.cityCode
        });
      }
    });
  }

  onChangeDestPincode(event: any) {
    this.prqService.getBranchCityFromPincode(event).subscribe((res: any) => {
      if (res.success && res.data && res.data.length > 0) {
        const loc = res.data[0];
        this.prqForm.patchValue({
          desBranchCode: loc.branch
        });
      }
    });
  }

  onSubmit() {
    if (this.prqForm.valid) {
      const formData = this.prqForm.getRawValue();
      let branchCode = this.identityService.getBranchCode();

      const payload = {
        objIndentHeader: {
          ...formData,
          // Convert string values to numbers
          approximateWeight: Number(formData.approximateWeight) || 0,
          approximatePackages: Number(formData.approximatePackages) || 0,
          pkgNo: Number(formData.approximatePackages) || 0,
          expectedFreight: Number(formData.expectedFreight) || 0,
          noOfVeh: Number(formData.noOfVeh) || 0,
          expMargin: Number(formData.expMargin) || 0,
          expTruckHire: Number(formData.expTruckHire) || 0,
          rpkg: Number(formData.rpkg) || 0,
          rpkm: Number(formData.rpkm) || 0,
          approxKM: Number(formData.approxKM) || 0,
          loadingExp: Number(formData.loadingExp) || 0,
          unloadingExp: Number(formData.unloadingExp) || 0,

          // IDs should likely be numbers as well based on the error
          indent_Id: '0',
          entryBy: this.commonService.globalFilters.UserID.toString(),
          entryDate: new Date(),
          updateDate: new Date(),
          emailID: formData.emailID ? formData.emailID.join(';') : '',
          requiredPlacementDateTime: formData.loadingDate ? this.datePipe.transform(formData.loadingDate, 'yyyy-MM-ddTHH:mm:ss') : '',
          destinationBranch: formData.desBranchCode,
          branch: formData.branchCode,
          customer_Name: formData.customer_Name,
          customer_KRM: formData.customer_KRM,
          actualPlacementDateTime: new Date(),
          expectedTAT: new Date(),
          planReceivedDateTime: new Date()
        },
        objIndentHeaderDetails: [
          {
            id: '0', // Numeric ID
            fromloc: formData.fromCity,
            toloc: formData.fromCity,
            remarks: formData.remarks,
            entryBy: this.commonService.globalFilters.UserID.toString(),
            entrydate: new Date(),
            indentNo: null,
            updateDate: new Date(),
          }
        ],
        baseUserName: this.commonService.globalFilters.UserID.toString(),
        baseLocationCode: branchCode
      };

      this.prqService.postSubmitPRQ(payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.sweetAlertService.success(`${res.data.message} : <b style="color:#0d6efd">${res.data.id}</b>`);
            this.dataEmitter.emit();
            this.onClose();
          } else {
            this.sweetAlertService.error(res.message);
          }
        },
        error: (err) => {
          this.sweetAlertService.error(err.error.message);
        }
      });
    } else {
      this.prqForm.markAllAsTouched();
    }
  }

}
