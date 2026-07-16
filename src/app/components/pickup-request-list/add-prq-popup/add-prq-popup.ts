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
  public transportModes: GeneralMaster[] = [];
  
  public emailData: any[] = [];
  public customerData: any[] = [];
  public isCustomerLoading: boolean = false;
  public isEmailLoading: boolean = false;
  public isPincodeLoading: boolean = false;
  public isDestPincodeLoading: boolean = false;
  public customerNotFoundText: string = 'Please enter 3 more characters';
  public emailNotFoundText: string = 'Please enter 3 more characters';
  public pincodeNotFoundText: string = 'Please enter 3 more characters';
  public destPincodeNotFoundText: string = 'Please enter 3 more characters';
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

    // Pincode Search Subscription
    this.pincodeSearchSubject.pipe(debounceTime(400)).subscribe((term: string) => {
      if (term?.trim() && term.length >= 3) {
        this.isPincodeLoading = true;
        this.prqService.getCityPincodeDetails(term).subscribe({
          next: (res: any) => {
            this.pincodeData = res.data || [];
            this.isPincodeLoading = false;
          },
          error: () => {
            this.pincodeData = [];
            this.isPincodeLoading = false;
          }
        });
      } else {
        this.pincodeData = [];
        this.isPincodeLoading = false;
      }
    });

    // Destination Pincode Search Subscription
    this.destPincodeSearchSubject.pipe(debounceTime(400)).subscribe((term: string) => {
      if (term?.trim() && term.length >= 3) {
        this.isDestPincodeLoading = true;
        this.prqService.getCityPincodeDetails(term).subscribe({
          next: (res: any) => {
            this.destPincodeData = res.data || [];
            this.isDestPincodeLoading = false;
          },
          error: () => {
            this.destPincodeData = [];
            this.isDestPincodeLoading = false;
          }
        });
      } else {
        this.destPincodeData = [];
        this.isDestPincodeLoading = false;
      }
    });
  }

  showPopup(type?: string) {
    this.initForm();
      this.getTransportModes();
      this.getFleetType()
  this.modalRef = this.modalService.show(this.Templatepod, { 
    backdrop: 'static', 
    class: 'modal-lg modal-dialog-centered' 
  });
  }

  initForm() {
    this.prqForm = new FormGroup({
      indentNo: new FormControl(null),
      groupCode:new FormControl(null),
      customerCode: new FormControl(null, Validators.required),
      prqDate: new FormControl(new Date(), Validators.required),
      pkgs:new FormControl(null),
      fleetType: new FormControl(null),
      weight: new FormControl(''),
      ftlType:new FormControl(null),
      service_Type:new FormControl(null),
      pinCode: new FormControl(null, Validators.required), // Pickup Pin Code
      desPincode: new FormControl(null, Validators.required),
      consigneeNameAdd: new FormControl('', Validators.required), // Delivery Address
      branchCode: new FormControl(''), // Pickup Branch
      customer_Name: new FormControl('', Validators.required),
      desBranchCode: new FormControl(''), // Destination Branch
      ewayBill:new FormControl(''),
      fromCity: new FormControl(''),
      fromCityCode: new FormControl(''),
      transportMode: new FormControl(null, Validators.required),
      coldChainCategory: new FormControl(''),
      tempRange: new FormControl(''),
      ewayBillNo: new FormControl(''),
      ewayBillDate: new FormControl(''),
      ewayExpDate: new FormControl(''),
      invoiceNo: new FormControl(''),
      invoiceDate: new FormControl(''),
      invoiceValue: new FormControl(''),
      consignorName: new FormControl(''),
      consigneeName: new FormControl(''),
      consignorAddress: new FormControl(''),
      consigneeAddress: new FormControl(''),
      consignorPin: new FormControl(''),
      consigneePin: new FormControl('')
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
    this.destPincodeData = [];
    this.destPincodeNotFoundText = 'Please enter 3 more characters';
    this.prqService.getBranchCityFromPincode(event).subscribe((res: any) => {
      if (res.success && res.data && res.data.length > 0) {
        const loc = res.data[0];
        this.prqForm.patchValue({
          desBranchCode: loc.branch
        });
      }
    });
  }

    getTransportModes(searchText: string | null = null) {
    this.expenseGeneralService.getGeneralMaster(searchText, 'SERCAT').subscribe({
      next: (response: any) => {
        if (response) {
          this.transportModes = response.data;
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

    getEwayBillData(event: any) {
    const search = event.target.value;
    if (search.length.toString() === "12") {
        this.prqService.checkEwaybill(search).subscribe({
          next: (checkRes: any) => {
            if (checkRes.status === "N" && search.length.toString() === "12") {
              // If not exist in ERP, call eWayBillData API
              this.prqService.eWayBillData(search).subscribe({
                next: (response: any) => {
                  if (response.status === 1) {
                    // always keep Date object for bsDatepicker
                    const invoiceDate = response.eWayBillInvoiceDate ? new Date(response.eWayBillInvoiceDate) : null;
                    const expiryDate =
                      response.eWayBillExpiredDate && response.eWayBillExpiredDate !== '1900-01-01T00:00:00'
                        ? new Date(response.eWayBillExpiredDate)
                        : null;
                    const invDate = response.invdt ? new Date(response.invdt) : null;

                    // check age of eWayBill
                    if (invoiceDate) {
                      const today = new Date();
                      const diffTime = Math.abs(today.getTime() - invoiceDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays > 15) {
                        this.sweetAlertService.warning("Error! E-Way Bill is older than 15 days.");
                        this.prqForm.patchValue({
                          ewayinvoiceDate: null,
                          ewayBillExpiry: null,
                          invoicedate: null,
                          ewayBillNo: null,
                          invoiceNo: null,
                          declaredvalue: null,
                          transportation_distance: null
                        });
                        // this.updateAllEwayBillValidations();
                        return;
                      }
                    }

                    // check expiry date
                    if (expiryDate && expiryDate < new Date()) {
                      this.sweetAlertService.warning("Please Check EWayBill Expired Date !!!!");
                      // if (!isInvoice) {
                      //   this.prqForm.patchValue({ ewayBillNo: null });
                      // }
                      this.prqForm.patchValue({
                        ewayinvoiceDate: null,
                        ewayBillExpiry: null,
                        invoicedate: null,
                        ewayBillNo: null,
                        invoiceNo: null,
                        declaredvalue: null,
                        transportation_distance: null
                      });
                      return;
                    }
                    this.prqForm.patchValue({
                      ewayinvoiceDate: invDate,
                      ewayBillExpiry: expiryDate,
                      // invoicedate: invoiceDate,
                      ewayBillNo: search,
                      invoiceNo: response.invno,
                      declaredvalue: response.decval,
                      transportation_distance: response.transportation_distance
                    })
                    // this.calculateSummary(index)
                    // if (!isInvoice) {
                    //   // this.getpincodeData(response.pincode.toString())
                    //   this.prqForm.patchValue({
                    //     consignorName: response.csgncd,
                    //     consigneeName: response.csgecd,
                    //     consigneeMasterName: response.csgenm,
                    //     consignorMasterName: response.csgnm,
                    //     consignorAddress: response.csgnAdd,
                    //     consigneeAddress: response.csgeAdd,
                    //     consigneePincode: response.toPincode.toString(),
                    //     consignorCity: response.fromCity,
                    //     consigneeCity: response.toCity,
                    //     consignorGSTNo: response.consignor,
                    //     consigneeGSTNo: response.consignee,
                    //     consignorPincode: response.pincode.toString(),
                    //   });
                    //   // this.getpincodeData(response.toPincode.toString())
                    //   this.getTransportModes(response.transMode.toString())
                    //   this.prqForm.patchValue({
                    //     billingName: response.partyName,
                    //     // mode: response.transMode.toString(),
                    //     pincode: response.toPincode.toString(),
                    //     // fromCity: response.fromCity,
                    //     toCity: null,
                    //     destination: response.destcd,
                    //   });
                    //   // this.GetPincodeOrigin('Origin');
                    // }
                  } 
                },
                error: () => {
                  this.sweetAlertService.error("Error !! Unable to fetch EWayBill data.");
                }
              });
            } else {
              this.sweetAlertService.warning("This EWay Bill Already Exist in ERP !!!");
              // if (!isInvoice) {
              //   this.prqForm.patchValue({ ewayBillNo: null });
              // }
              this.prqForm.patchValue({
                ewayinvoiceDate: null,
                ewayBillExpiry: null,
                invoicedate: null,
                ewayBillNo: null,
                invoiceNo: null,
                declaredvalue: null,
                transportation_distance: null
              });
            }
          },
          error: () => {
            this.sweetAlertService.error("Error !! Failed to check EWay Bill in ERP.");
          }
        });
     
    } 
  }

  onSubmit() {
    if (this.prqForm.valid) {
      const formData = this.prqForm.getRawValue();
      let branchCode = this.identityService.getBranchCode();

      const payload = {
        objIndentHeader: {
          ...formData,
          // Convert string values to numbers
          weight: Number(formData.weight) || 0,
          pkgs: Number(formData.pkgs) || 0,
          pkgNo: Number(formData.pkgs) || 0,
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
          requiredPlacementDateTime: formData.prqDate ? this.datePipe.transform(formData.prqDate, 'yyyy-MM-ddTHH:mm:ss') : '',
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
