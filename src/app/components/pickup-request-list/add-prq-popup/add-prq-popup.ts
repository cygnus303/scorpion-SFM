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
import { ComplaintService } from '../../../shared/services/complaint.service';
import { ExternalService } from '../../../shared/services/external.service';

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
  public branchList :any;
  public vehicleCountList = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, text: (i + 1).toString() }));
  public minDate = new Date();
  public allPaybaseData: any[] = [];
  public paybaseData: any[] = [];
  public allowedPaybasList: any = null;
  public contractErrorMsg: string = '';
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
  public complaintService = inject(ComplaintService);
  public externalService = inject(ExternalService)

  ngOnInit(): void {
    this.initForm();
    this.getLocations();
   this.getBillingTypeData();
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
     this.allowedPaybasList = null;
    this.contractErrorMsg = '';
    this.paybaseData = [...this.allPaybaseData];
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
      pickupBranch:new FormControl(null, Validators.required),
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
      payBase:new FormControl(null,Validators.required),
      contractID:new FormControl(null),
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
     this.allowedPaybasList = null;
    this.contractErrorMsg = '';
    this.paybaseData = [...this.allPaybaseData];
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
          fromCityCode: loc.cityCode,
          pickupBranch: loc.locCode,
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
     this.contractErrorMsg = '';
    if (event && event.text) {
      this.prqForm.patchValue({
        customer_Name: event.text,
          payBase: null,
        transportMode: null,
        service_Type: null,
        ftlType: null
      });
    } else {
      this.prqForm.patchValue({
        customer_Name: '',
        payBase: null,
        transportMode: null,
        service_Type: null,
        ftlType: null
      });
      this.allowedPaybasList = null;
      this.paybaseData = [...this.allPaybaseData];
      this.serviceData = [];
      this.transportModes = [];
      return;
    }
 this.allowedPaybasList = null;
     this.serviceData = [];
    this.transportModes = [];
    this.getContract(event?.id, '');
  }

    filterPaybase(paybasSource: any) {
    if (!paybasSource) return;

    let allowedList: string[] = [];
    if (typeof paybasSource === 'string') {
      allowedList = paybasSource.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    } else if (Array.isArray(paybasSource)) {
      paybasSource.forEach(item => {
        if (typeof item === 'string') {
          allowedList.push(...item.split(',').map(s => s.trim().toUpperCase()).filter(Boolean));
        } else if (item) {
          const val = (item.codeId || item.codeDesc || item.paybas || item.PayBas || '').toString().trim().toUpperCase();
          if (val) allowedList.push(val);
        }
      });
    }

    if (this.allPaybaseData && this.allPaybaseData.length > 0) {
      const filtered = this.allPaybaseData.filter((item: any) => {
        const id = (item.codeId || '').toString().trim().toUpperCase();
        const desc = (item.codeDesc || '').toString().trim().toUpperCase();
        return allowedList.some(a => a === id || a === desc || desc.includes(a) || id.includes(a));
      });

      if (filtered.length > 0) {
        this.paybaseData = filtered;
      } else {
        this.paybaseData = allowedList.map(a => ({ codeId: a, codeDesc: a }));
      }
    } else {
      this.paybaseData = allowedList.map(a => ({ codeId: a, codeDesc: a }));
    }

   
      const current = this.prqForm.get('payBase')?.value;
      if (current && !this.paybaseData.some(p => p.codeId === current)) {
        this.prqForm.patchValue({ payBase: null });
      }
  }

  onPayBasChange(event: any) {
    this.contractErrorMsg = '';
     this.prqForm.patchValue({
      transportMode: null,
      service_Type: null,
      ftlType: null
    });
    const paybas = event ? (event.codeId || (typeof event === 'string' ? event : '')) : '';
    if (!paybas) {
      this.serviceData = [];
      this.transportModes = [];
      return;
    }
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

  getContract(customerId?: any, paybas?: any) {
    const custCode = customerId || this.prqForm.get('customerCode')?.value;
    const paybasValue = paybas !== undefined && paybas !== null ? paybas : (this.prqForm.get('payBase')?.value || '');
    if (!custCode) {
      return;
    }

    const isPaybasBlank = !paybasValue || paybasValue.toString().trim() === '';

    this.prqService.getContractDetail(custCode, paybasValue).subscribe({
      next: (response: any) => {
        if (response && response.data && response.data.length > 0) {
          const item = response.data[0];
          const contractId = (item.contractId || '').toString().trim();
          const serviceTypesStr = item.serviceTypes || '';
          const transportTypesStr = item.transportTypes || '';
           const custcatStr = (item.custcat || item.payBas || '').toString().trim().toUpperCase();
          const custcatList = custcatStr.split(',').map((c: string) => c.trim()).filter(Boolean);

          this.prqForm.patchValue({
            contractID: item.contractId || ''
          });

          const hasP02 = custcatList.includes('P02') || (paybasValue && paybasValue.toString().trim().toUpperCase() === 'P02');
          const hasNonP02 = custcatList.some((c: string) => c !== 'P02');
          const isOnlyP02 = custcatList.length > 0 && custcatList.every((c: string) => c === 'P02');
          const isP02Selected = paybasValue && paybasValue.toString().trim().toUpperCase() === 'P02';

          if (!contractId && hasP02 && hasNonP02) {
            this.contractErrorMsg = 'No active TBB contract found for this customer';
            if (isPaybasBlank) {
              let paybasDataFromApi = item.custcat || item.payBas || '';

              if (!paybasDataFromApi && response.data.length > 1) {
                const allPay = response.data.map((d: any) => d.custcat || d.payBas).filter(Boolean);
                if (allPay.length > 0) {
                  paybasDataFromApi = allPay;
                }
              }

              if (paybasDataFromApi) {
                this.allowedPaybasList = paybasDataFromApi;
                this.filterPaybase(paybasDataFromApi);
              }
              return;
            }
          }

          // 2. Jo specific P02 select karyu hoy ane contractId nathi:
          if (!contractId && isP02Selected) {
            const errorMsg = 'No active TBB contract found for this customer';
            this.contractErrorMsg = errorMsg;
            this.sweetAlertService.error(errorMsg);
            this.prqForm.patchValue({
              payBase: null,
              transportMode: null,
              service_Type: null,
              ftlType: null
            });
            this.serviceData = [];
            this.transportModes = [];
            return;
          }

          // 3. Jo fakt P02 j chhe (bijo koi custcat nathi) ane contractId nathi:
          if (!contractId && isOnlyP02) {
            const errorMsg = 'No active contract';
            this.contractErrorMsg = errorMsg;
            this.sweetAlertService.error(errorMsg);
            this.prqForm.patchValue({
              payBase: null,
              transportMode: null,
              service_Type: null,
              ftlType: null
            });
            this.serviceData = [];
            this.transportModes = [];
            if (isPaybasBlank) {
              this.paybaseData = [];
            }
            return;
          }

          // 2. Jo P02 sivay na custcat aave to paybas nu dropdown bind thavu joia
          if (isPaybasBlank && hasNonP02) {
            let paybasDataFromApi = item.custcat || item.payBas || '';

            if (!paybasDataFromApi && response.data.length > 1) {
              const allPay = response.data.map((d: any) => d.custcat || d.payBas).filter(Boolean);
              if (allPay.length > 0) {
                paybasDataFromApi = allPay;
              }
            }

            if (paybasDataFromApi) {
              this.allowedPaybasList = paybasDataFromApi;
              this.filterPaybase(paybasDataFromApi);
            }
            this.contractErrorMsg = '';

            // Jo contractId nathi ane initial load (paybas blank) chhe, to aagal return kari devu jethi error na aave
            if (!contractId && serviceTypesStr.trim() === '' && transportTypesStr.trim() === '') {
              return;
            }
          }

          if (serviceTypesStr.trim() === '' && transportTypesStr.trim() === '') {
            const errorMsg = paybasValue
              ? `Contract is not available for this customer in selected PayBasis (${paybasValue}).`
              : 'Contract details are not available for this customer. Cannot proceed with PRQ generation.';
            this.contractErrorMsg = errorMsg;
            this.sweetAlertService.error(errorMsg);
            this.prqForm.patchValue({
              payBase: null,
              transportMode: null,
              service_Type: null,
              ftlType: null
            });
            this.serviceData = [];
            this.transportModes = [];
            if (isPaybasBlank) {
              this.paybaseData = [];
            }
            return;
          }

          this.contractErrorMsg = '';

          // Only filter PayBas dropdown if paybas in request was null or blank!
         if (isPaybasBlank) {
            let paybasDataFromApi = item.custcat || '';

            if (!paybasDataFromApi) {
              paybasDataFromApi = item.payBas || '';
            }

            if (!paybasDataFromApi && response.data.length > 1) {
              const allPay = response.data.map((d: any) => d.custcat || d.payBas).filter(Boolean);
              if (allPay.length > 0) {
                paybasDataFromApi = allPay;
              }
            }

            if (paybasDataFromApi) {
              this.allowedPaybasList = paybasDataFromApi;
              this.filterPaybase(paybasDataFromApi);
            }
          }

          if (transportTypesStr) {
            this.getTransportModes('', transportTypesStr);
          } else {
            this.transportModes = [];
          }

          if (serviceTypesStr) {
            this.serviceData = serviceTypesStr.split(',').map((s: string) => ({ name: s.trim(), value: s.trim() })).filter((s: any) => s.value !== '');
          } else {
            this.serviceData = [];
          }
          if (this.serviceData.length === 1) {
            this.prqForm.patchValue({ service_Type: this.serviceData[0].value });
          }
        } else {
          const errorMsg = paybasValue
            ? `Contract is not available for this customer in selected PayBasis (${paybasValue}).`
            : 'No active contract';
          this.contractErrorMsg = errorMsg;
          this.sweetAlertService.error(errorMsg);
          this.serviceData = [];
          this.transportModes = [];
          if (paybasValue) {
            this.prqForm.patchValue({ 
              payBase: null ,
              transportMode: null,
              service_Type: null,
              ftlType: null
            });
          } else if (isPaybasBlank) {
            this.paybaseData = [];
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
              pickupBranch:data.PickupBranch
            });
          }, 500);
        }

      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
    });
  }

   getLocations() {
    this.complaintService.getTicketAddressTo().subscribe({
      next: (response) => {
        if (response) {
          this.branchList = response.data.map((user: any) => ({
            locCode: user.locCode,
            locName: `${user.locCode}: ${user.locName}`,
          }));
        }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response);
      },
    });
  }

  
  getBillingTypeData() {
    this.externalService.getGeneralMaster('','PAYTYP').subscribe({
      next: (response) => {
        if (response.success) {
          this.allPaybaseData = response.data || [];
          if (this.allowedPaybasList) {
            this.filterPaybase(this.allowedPaybasList);
          } else {
            this.paybaseData = response.data || [];
          }
        }
      }
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
        pickupBranch:formData.pickupBranch || '',
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
