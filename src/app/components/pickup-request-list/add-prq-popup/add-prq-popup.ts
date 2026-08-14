import { Component, EventEmitter, inject, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { GeneralMaster } from '../../../shared/models/expenseGeneral.model';
import { CommonModule, DatePipe } from '@angular/common';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { NgSelectModule } from '@ng-select/ng-select';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { CommonService } from '../../../shared/services/common.service';
import { PrqService } from '../../../shared/services/prq-service';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { IdentityService } from '../../../shared/services/identity.service';
import Swal from 'sweetalert2';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-add-prq-popup',
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, BsDatepickerModule],
  providers: [DatePipe],
  templateUrl: './add-prq-popup.html',
  styleUrl: './add-prq-popup.scss',
})
export class AddPrqPopup {
  public modalRef!: BsModalRef;
  public PRQType: string = '';
  public transportModes: any[] = [];
  public coldChainCategories: any[] = [
    { name: 'Chiller', value: 'Chiller' },
    { name: 'Refer', value: 'Refer' }
  ];

  public emailData: any[] = [];
  public customerData: any[] = [];
  public isCustomerLoading: boolean = false;
  public isEmailLoading: boolean = false;
  public isPincodeLoading: boolean = false;
  public isDestPincodeLoading: boolean = false;
  public customerNotFoundText: string = 'Please enter 3 more characters';
  public emailNotFoundText: string = 'Please enter 3 more characters';
  public pincodeNotFoundText: string = 'Please enter 2 more characters';
  public destPincodeNotFoundText: string = 'Please enter 2 more characters';

  public consignorPincodeData: any[] = [];
  public isConsignorPincodeLoading: boolean = false;
  public consignorPincodeSearchSubject: Subject<string> = new Subject<string>();
  public consignorPincodeNotFoundText: string = 'Please enter 2 more characters';

  public consigneePincodeData: any[] = [];
  public isConsigneePincodeLoading: boolean = false;
  public consigneePincodeSearchSubject: Subject<string> = new Subject<string>();
  public consigneePincodeNotFoundText: string = 'Please enter 2 more characters';

  public searchSubject: Subject<string> = new Subject<string>();
  public customerSearchSubject: Subject<string> = new Subject<string>();
  public pincodeSearchSubject: Subject<string> = new Subject<string>();
  public destPincodeSearchSubject: Subject<string> = new Subject<string>();
  public prqForm!: FormGroup;
  public pincodeData: any[] = [];
  public destPincodeData: any[] = [];
  public productTypeData: GeneralMaster[] = [];
  public fleetTypeData: any[] = [];
  public serviceData: any[] = [];
  public PRQNo: any;
  public vehicleCountList = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, text: (i + 1).toString() }));
  public minDate = new Date();
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

    // Customer Search Subscription
    this.customerSearchSubject.pipe(debounceTime(400)).subscribe((term: string) => {
      if (term?.trim() && term.length >= 3) {
        this.isCustomerLoading = true;
        this.prqService.getCustomerList(term).subscribe({
          next: (res: any) => {
            this.customerData = res?.data || [];
            this.isCustomerLoading = false;
          },
          error: () => {
            this.customerData = [];
            this.isCustomerLoading = false;
          }
        });
      } else {
        this.customerData = [];
        this.isCustomerLoading = false;
      }
    });

    // Pickup Pincode Search Subscription
    this.pincodeSearchSubject.pipe(debounceTime(400)).subscribe((term: string) => {
      if (term?.trim() && term.length >= 3) {
        this.getPincodeData(term, 'pickup');
      } else {
        this.pincodeData = [];
        this.pincodeNotFoundText = 'Please enter 3 more characters';
      }
    });

    // Destination Pincode Search Subscription
    this.destPincodeSearchSubject.pipe(debounceTime(400)).subscribe((term: string) => {
      if (term?.trim() && term.length >= 3) {
        this.getPincodeData(term, 'delivery');
      } else {
        this.destPincodeData = [];
        this.destPincodeNotFoundText = 'Please enter 3 more characters';
      }
    });

    // Consignor Pincode Search Subscription
    this.consignorPincodeSearchSubject.pipe(debounceTime(400)).subscribe((term: string) => {
      if (term?.trim() && term.length >= 2) {
        this.getPincodeData(term, 'consignor');
      } else {
        this.consignorPincodeData = [];
        this.consignorPincodeNotFoundText = 'Please enter 3 more characters';
      }
    });

    // Consignee Pincode Search Subscription
    this.consigneePincodeSearchSubject.pipe(debounceTime(400)).subscribe((term: string) => {
      if (term?.trim() && term.length >= 2) {
        this.getPincodeData(term, 'consignee');
      } else {
        this.consigneePincodeData = [];
        this.consigneePincodeNotFoundText = 'Please enter 3 more characters';
      }
    });
  }

  getPincodeData(term: string, type: 'pickup' | 'delivery' | 'consignor' | 'consignee') {
    const payload = {
      "FilterJson": {
        "ReportId": "223",
        "Prefix": term
      }
    };

    if (type === 'pickup') {
      this.isPincodeLoading = true;
      this.pincodeNotFoundText = 'Loading...';
    } else if (type === 'delivery') {
      this.isDestPincodeLoading = true;
      this.destPincodeNotFoundText = 'Loading...';
    } else if (type === 'consignor') {
      this.isConsignorPincodeLoading = true;
      this.consignorPincodeNotFoundText = 'Loading...';
    } else if (type === 'consignee') {
      this.isConsigneePincodeLoading = true;
      this.consigneePincodeNotFoundText = 'Loading...';
    }

    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (res: any) => {
        const data = res.Table1 || [];
        if (type === 'pickup') {
          this.pincodeData = data;
          this.isPincodeLoading = false;
          if (data.length === 0) this.pincodeNotFoundText = 'No pincode found';
        } else if (type === 'delivery') {
          this.destPincodeData = data;
          this.isDestPincodeLoading = false;
          if (data.length === 0) this.destPincodeNotFoundText = 'No pincode found';
        } else if (type === 'consignor') {
          this.consignorPincodeData = data;
          this.isConsignorPincodeLoading = false;
          if (data.length === 0) this.consignorPincodeNotFoundText = 'No pincode found';
        } else if (type === 'consignee') {
          this.consigneePincodeData = data;
          this.isConsigneePincodeLoading = false;
          if (data.length === 0) this.consigneePincodeNotFoundText = 'No pincode found';
        }
      },
      error: () => {
        if (type === 'pickup') {
          this.pincodeData = [];
          this.isPincodeLoading = false;
          this.pincodeNotFoundText = 'Error fetching data';
        } else if (type === 'delivery') {
          this.destPincodeData = [];
          this.isDestPincodeLoading = false;
          this.destPincodeNotFoundText = 'Error fetching data';
        } else if (type === 'consignor') {
          this.consignorPincodeData = [];
          this.isConsignorPincodeLoading = false;
          this.consignorPincodeNotFoundText = 'Error fetching data';
        } else if (type === 'consignee') {
          this.consigneePincodeData = [];
          this.isConsigneePincodeLoading = false;
          this.consigneePincodeNotFoundText = 'Error fetching data';
        }
      }
    });
  }

  showPopup(prqNo?: string) {
    this.PRQNo = prqNo;
    this.initForm();
    // this.getTransportModes();
    this.getFleetType()
    this.modalRef = this.modalService.show(this.Templatepod, {
      backdrop: 'static',
      class: 'modal-lg modal-dialog-centered'
    });
    if (prqNo) {
      this.editPRQ(prqNo);
    }
  }

  rebuildForm() {
    const ewayBill = this.prqForm.get('ewayBill')?.value;
    const serviceType = this.prqForm.get('service_Type')?.value;

    this.initForm();

    this.prqForm.patchValue({
      ewayBill: ewayBill,
      service_Type: serviceType
    });

    this.customerData = [];
    this.pincodeData = [];
    this.destPincodeData = [];
  }

  initForm() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.prqForm = new FormGroup({
      indentNo: new FormControl(null),
      groupCode: new FormControl(null),
      customerCode: new FormControl(null, Validators.required),
      prqDate: new FormControl(new Date(), Validators.required),
      prqTime: new FormControl(currentTime, Validators.required),
      pkgs: new FormControl(null, Validators.required),
      fleetType: new FormControl(null),
      weight: new FormControl('', Validators.required),
      ftlType: new FormControl(null),
      service_Type: new FormControl(null),
      pinCode: new FormControl(null, Validators.required), // Pickup Pin Code
      desPincode: new FormControl(null),
      // consigneeNameAdd: new FormControl('', Validators.required), // Delivery Address
      branchCode: new FormControl(''), // Pickup Branch
      customer_Name: new FormControl(''),
      desBranchCode: new FormControl(''), // Destination Branch
      ewayBill: new FormControl('without'),
      fromCity: new FormControl('', Validators.required),
      fromCityCode: new FormControl(''),
      transportMode: new FormControl(null, Validators.required),
      coldChainCategory: new FormControl(null),
      tempRange: new FormControl(''),
      ewayBillNo: new FormControl(''),
      ewayBillDate: new FormControl(''),
      ewayExpDate: new FormControl(''),
      invoiceNo: new FormControl(''),
      invoiceDate: new FormControl(null),
      invoiceValue: new FormControl(''),
      consignorName: new FormControl(''),
      consigneeName: new FormControl(''),
      consignorAddress: new FormControl(''),
      consigneeAddress: new FormControl(''),
      consignorPin: new FormControl(null),
      consigneePin: new FormControl(null),
      consigneeContactNo:new FormControl(null),
      consignorContactNo:new FormControl(null,[Validators.required, Validators.pattern('^[0-9]{10}$')])
    });

    this.prqForm.get('service_Type')?.valueChanges.subscribe((val) => {
      const ftlControl = this.prqForm.get('ftlType');
      if (val === 'FTL') {
        ftlControl?.setValidators(Validators.required);
      } else {
        ftlControl?.clearValidators();
      }
      ftlControl?.updateValueAndValidity();
    });
  }

  onClose() {
    this.modalRef.hide();
    this.initForm();
    this.customerData = [];
    this.customerNotFoundText = 'Please enter 3 more characters';
    this.emailData = [];
    this.emailNotFoundText = 'Please enter 3 more characters';
    this.pincodeData = [];
    this.destPincodeData = [];
    this.pincodeNotFoundText = 'Please enter 3 more characters';
    this.destPincodeNotFoundText = 'Please enter 3 more characters';
  }

  onChangePincode(event: any) {
    this.pincodeData = [];
    this.pincodeNotFoundText = 'Please enter 3 more characters';
    this.prqService.getBranchCityFromPincode(event?.Value).subscribe((res: any) => {
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
    this.destPincodeData = [];
    this.destPincodeNotFoundText = 'Please enter 3 more characters';
    this.prqService.getBranchCityFromPincode(event?.Value).subscribe((res: any) => {
      if (res.success && res.data && res.data.length > 0) {
        const loc = res.data[0];
        this.prqForm.patchValue({
          desBranchCode: loc.branch
        });
      }
    });
  }

  onCustomerSelect(event: any) {
    if (event && event.text) {
      this.prqForm.patchValue({
        customer_Name: event.text
      });
    } else {
      this.prqForm.patchValue({
        customer_Name: ''
      });
    }
    this.getContract(event?.id);
  }

  onColdChainCategoryChange(event?: any) {
    const category = event?.value || event?.target?.value || (typeof event === 'string' ? event : null) || this.prqForm.get('coldChainCategory')?.value;
    if (category === 'Chiller') {
      this.prqForm.patchValue({ tempRange: '0°C to 25°C' });
    } else if (category === 'Refer') {
      this.prqForm.patchValue({ tempRange: '-0°C to -18°C' });
    } else {
      this.prqForm.patchValue({ tempRange: '' });
    }
  }

  getTransportModes(searchText: string | null = null, mode: any) {
    this.expenseGeneralService.getGeneralMaster(searchText, 'TRN').subscribe({
      next: (response: any) => {
        if (response) {
          this.transportModes = response.data.filter((item: any) => mode?.includes(item.codeDesc) || mode?.includes(item.codeId));
        }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
    });
  }

  getContract(customerId?: any) {
    // const custCode = 'C00120010';
    this.prqService.getContractDetail(customerId).subscribe({
      next: (response: any) => {
        if (response && response.data && response.data.length > 0) {
          const serviceTypesStr = response.data[0].serviceTypes || '';
          const transportTypesStr = response.data[0].transportTypes || '';
          if (serviceTypesStr.trim() === '' && transportTypesStr.trim() === '') {
            this.sweetAlertService.info('Contract details are not available for this customer. Cannot proceed with PRQ generation.');
            this.prqForm.patchValue({
              customerCode: null,
            });
            return;
          }
          this.getTransportModes('', transportTypesStr)

          this.serviceData = serviceTypesStr.split(',').map((s: string) => ({ name: s.trim(), value: s.trim() })).filter((s: any) => s.value !== '');

          if (this.serviceData.length === 1) {
            this.prqForm.patchValue({ service_Type: this.serviceData[0].value });
          }
        }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
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

  formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(+year, +month - 1, +day);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(',', '').toLowerCase();
  };

  editPRQ(prqNo: string) {
    const payload = {
      "FilterJson": {
        "ReportId": "225",
        "PRQNo": prqNo
      }
    };
    this.expenseGeneralService.getDynamicData(payload).subscribe({
      next: (response: any) => {
        if (response && response.Table1 && response.Table1.length > 0) {
          const data = response.Table1[0];
          this.getTransportModes('', data.TransitMode)
          if (data.CustomerCode) this.customerData = [{ id: data.CustomerCode, text: data.CustomerName }];
          // if (data.TransitMode) this.transportModes = [{ codeId: data.TransitMode, codeDesc: data.TransitMode }];
          if (data.FTLType) this.fleetTypeData = [{ codeId: data.FTLType, codeDesc: data.FTLType }];
          if (data.PickupPincode) this.pincodeData = [{ Value: data.PickupPincode, Text: data.PickupPincode }];
          if (data.DeliveryPincode) this.destPincodeData = [{ Value: data.DeliveryPincode, Text: data.DeliveryPincode }];
          if (data.ConsignorPincode) this.consignorPincodeData = [{ Value: data.ConsignorPincode, Text: data.ConsignorPincode }];
          if (data.ConsigneePincode) this.consigneePincodeData = [{ Value: data.ConsigneePincode, Text: data.ConsigneePincode }];

          let parsedDate = new Date();
          let parsedTime = `${parsedDate.getHours().toString().padStart(2, '0')}:${parsedDate.getMinutes().toString().padStart(2, '0')}`;
          if (data.PRQDate) {
            parsedDate = new Date(data.PRQDate);
            parsedTime = `${parsedDate.getHours().toString().padStart(2, '0')}:${parsedDate.getMinutes().toString().padStart(2, '0')}`;
          }
          setTimeout(() => {
            // Map the available fields from ReportId 222
            this.prqForm.patchValue({
              groupCode: data.PRQNo,
              prqDate: parsedDate,
              prqTime: parsedTime,
              service_Type: data.ServiceType,
              customerCode: data.CustomerCode,
              fromCity: data.FromCity,
              invoiceNo: data.InvoiceNo,
              invoiceDate: data.InvoiceDate ? new Date(data.InvoiceDate) : null,
              invoiceValue: data.InvoiceValue,
              customer_Name: data.CustomerName,
              pkgs: data.PKGS,
              weight: data.ApproxWeight,
              transportMode: data.TransitMode,
              ftlType: data.FTLType,
              pinCode: data.PickupPincode,
              desPincode: data.DeliveryPincode,
              desBranchCode: data.ToCity,
              coldChainCategory: data.ColdChainCategory,
              tempRange: data.TempRange,
              consignorName: data.ConsignorName,
              consigneeName: data.ConsigneeName,
              consignorAddress: data.ConsignorAddress,
              consigneeAddress: data.ConsigneeAddress,
              consignorPin: data.ConsignorPincode,
              consigneePin: data.ConsigneePincode,
              consignorContactNo:data.ConsignorContactno,
              consigneeContactNo:data.ConsigneeContactno,
            });
          }, 500);
        }

      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
    });
  }


  onSubmit() {
    if (this.prqForm.valid) {
      const formData = this.prqForm.getRawValue();
      let branchCode = this.identityService.getBranchCode();
      let finyear = this.identityService.getFinYear();
      let prqDateStr = '';
      if (formData.prqDate) {
        const d = new Date(formData.prqDate);
        if (formData.prqTime) {
          const [hours, minutes] = formData.prqTime.split(':');
          d.setHours(Number(hours), Number(minutes), 0, 0);
        }
        prqDateStr = this.datePipe.transform(d, 'yyyy-MM-dd HH:mm:ss.000') || '';
      }

      const payload = {
        customerCode: formData.customerCode || '',
        customerName: formData.customer_Name || '',
        pkgs: Number(formData.pkgs) || 0,
        approxWeight: Number(formData.weight) || 0,
        transitMode: formData.transportMode || '',
        ftlType: formData.ftlType || '',
        pickupPincode: formData.pinCode?.toString() || '',
        fromCity: formData.fromCity || '',
        deliveryPincode: formData.desPincode?.toString() || '',
        toCity: formData.desBranchCode || '',
        coldChainCategory: formData.coldChainCategory || '',
        tempRange: formData.tempRange || '',
        ewayBillType: formData.ewayBill || '',
        serviceType: formData.service_Type || '',
        eWayBillNo: formData.ewayBillNo || '',
        eWayBillDateStr: formData.ewayBillDate || '',
        eWayBillExpiryDateStr: formData.ewayExpDate || '',
        invoiceNo: formData.invoiceNo || '',
        invoiceDateStr: formData.invoiceDate ? (this.datePipe.transform(formData.invoiceDate, 'dd/MM/yyyy') || '') : '',
        invoiceValue: Number(formData.invoiceValue) || 0,
        consignorName: formData.consignorName || '',
        consigneeName: formData.consigneeName || '',
        consignorAddress: formData.consignorAddress || '',
        consigneeAddress: formData.consigneeAddress || '',
        consignorPincode: formData.consignorPin?.toString() || '',
        consigneePincode: formData.consigneePin?.toString() || '',
        prqDate: prqDateStr,
        baseLocationCode: branchCode || '',
        baseUserName: this.commonService.globalFilters?.UserID?.toString() || '',
        baseFinYear: finyear,
        type: formData.groupCode ? 'E' : '',
        prqNo: formData.groupCode || '',
        consignorContactno:formData.consignorContactNo,
        consigneeContactno:formData.consigneeContactNo,
      };

      this.prqService.submitPRQ(payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.sweetAlertService.success(`${res.data.message} : <b style="color:#0d6efd">${res.data.id}</b>`);
            this.dataEmitter.emit();
            this.onClose();
            const payload = {
              "FilterJson": {
                "ReportId": "226",
                "PRQNo": res.data.id,
                "PRQDt": prqDateStr
              }
            };
            this.expenseGeneralService.getDynamicData(payload).subscribe({ next: (response: any) => { } });
          } else {
            this.sweetAlertService.error(res.message);
          }
        },
        error: (err) => {
          let errorMessage = err.error?.message;
          if (!errorMessage && err.error?.errors) {
            errorMessage = Object.values(err.error.errors).flat().join('\\n');
          }
          if (!errorMessage) {
            errorMessage = err.error?.title || 'An error occurred';
          }
          this.sweetAlertService.error(errorMessage);
        }
      });
    } else {
      this.prqForm.markAllAsTouched();
      const invalidControls = [];
      const controls = this.prqForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          invalidControls.push(name);
        }
      }
      console.log('Invalid Controls:', invalidControls);
    }
  }

}
