import { Component, EventEmitter, Input, OnInit, Output, Query, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { Quotation } from '../../../shared/services/quotation';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';

@Component({
  selector: 'app-add-qm',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, BsDatepickerModule],
  templateUrl: './add-qm.component.html',
  styleUrl: './add-qm.component.scss'
})
export class AddQmComponent implements OnInit {
  @Input() customerData: any; // Passed from parent when clicking "Add QM"
  @Output() onBack = new EventEmitter<void>();
  public signingLocationList:any;
  public payBaseList: any[] = [];
  public customerSupportUserDetailList: any[] = [];
  public stateList: any[] = [];
  public cityList: any[] = [];
  public pincodeList: any[] = [];
  public zoneList: any[] = [];
  public matricesData = [
    { label: 'City to City', value: 'C' },
    { label: 'Zone to Zone', value: 'Z' },
    { label: 'State to State', value: 'S' },
    { label: 'Pin Code to Pin Code', value: 'P' }
  ];
  public weightConsiderList = [
    { label: 'Higher of Volumetric and Actual Weight', value: 'H' },
    { label: 'Always Actual weight', value: 'A' },
    { label: 'Always Volumetric weight', value: 'V' },
  ];
  public freightRateTypeList = [
    { label: 'In % of Freight', value: 'H' },
    { label: 'Flat (In Rs.)', value: 'F' },
    { label: 'PerKg', value: 'W' },
    { label: 'PerPkg', value: 'P' },
    { label: 'PerTon', value: 'T' }
  ];

  public qmForm!: FormGroup;
  private fb = inject(FormBuilder);

  public billingFrequencies = ['Monthly', 'Weekly', 'Fortnightly'];
  
  public serviceMatrix = [
    { name: 'LTL', road: false, air: false, sample: false, incineration: false, coldChain: false, ptl: false, superExpress: false },
    { name: 'FTL', road: false, air: false, sample: false, incineration: false, coldChain: false, ptl: false, superExpress: false }
  ];

  public selectedCombinations: { service: string, mode: string, key: string }[] = [];
  public activeCombinationKey: string = '';

  public valueAddedChargeKeys = [
    { key: 'documentCharges', label: 'Document Charges' },
    { key: 'fov', label: 'FOV' },
    { key: 'fuelSurcharge', label: 'Fuel Surcharge (FSC)' },
    { key: 'appointmentCharges', label: 'Appointment Charges' },
    { key: 'csdDeliveryCharges', label: 'CSD Delivery Charges' },
    { key: 'jkDeliveryCharges', label: 'J & K Delivery Charges' },
    { key: 'keralaDeliveryCharges', label: 'Kerala Delivery Charges' },
    { key: 'greenTaxCharges', label: 'Green Tax Charges' },
    { key: 'sikkimTax', label: 'Sikkim Tax (SNT)' },
    { key: 'westBengalCharges', label: 'West Bengal Charges' },
    { key: 'mallDeliveryCharges', label: 'Mall Delivery Charges' },
    { key: 'codCharges', label: 'COD Charges' },
    { key: 'varaiCharges', label: 'Varai Charges' },
    { key: 'toPayCharges', label: 'TO PAY Charges' },
    { key: 'physicalPod', label: 'Physical POD' },
    { key: 'extraDeliveryCharges', label: 'Extra Delivery Charges' },
    { key: 'pickupCharges', label: 'Pickup Charges' },
    { key: 'extraHandlingCharges', label: 'Extra Handling Charges' },
    { key: 'multiPickupCharges', label: 'Multi Pickup Charges' },
    { key: 'multiDeliveryCharges', label: 'Multi Delivery Charges' }
  ];

  constructor(
    private quotationService:Quotation,
    private expenseGeneralService: ExpenseGeneralService
  ){}

  ngOnInit() {
    this.initForm();
    this.getSigningLocation();
    this.getPayBaseList();
    this.getCustomerSupportUserDetail();
    this.fetchMasterLists();
    if (this.customerData) {
      // Patch initial data based on prospect
      this.qmForm.patchValue({
        customerName: this.customerData.ProspectName || this.customerData.CustName,
        customerCode: this.customerData.CUSTCD || this.customerData.LeadId
      });
    }
  }

  initForm() {
    this.qmForm = this.fb.group({
      // CUSTOMER DETAILS
      customerName: ['', Validators.required],
      customerCode: ['', Validators.required],
      signingLocation: [null, Validators.required],
      validityFrom: [null, Validators.required],
      validityTo: [null, Validators.required],
      billingFrequency: [null, Validators.required],
      customerRep: ['', Validators.required],
      designation: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contactNumber: ['', Validators.required],
      payBase: [null, Validators.required],

      // CUSTOMER GROUP NAME
      groupName: [null, Validators.required],

      // COMPANY DETAILS
      companyEmpName: ['', Validators.required],
      companyDesignation: ['', Validators.required],
      companyEmail: ['', [Validators.required, Validators.email]],
      companyContact: ['', Validators.required],

      // CSE DETAILS
      cseName: ['', Validators.required],
      cseEmail: ['', [Validators.required, Validators.email]],

      // COMMERCIALS ARRAY
      commercials: this.fb.array([]),

      // VOLUMETRIC DETAILS
      weightToConsider: [null, Validators.required],
      ratio: [null],
      measurement: [null],

      // DEMURRAGE DETAILS
      demurrageApplicable: [null, Validators.required],
      demurrageBasis: [null],
      freeStorageDays: [null],
      demurrageRateType: [null],
      minAmount: ['0.00'],
      maxAmount: ['0.00'],
      demRateTypeRadio: ['% of invoice'],

      // RISK INFORMATION
      riskInfo: [null, Validators.required],

      // ODA CHARGES
      odaChargeType: [null],
      odaPerKgActive: [false],
      odaPerKgMode: [null],
      odaPerKgCustomSlabs: this.fb.array([]),

      // DIESEL HIKE INFORMATION
      dphApplicable: [null, Validators.required],
      baseDieselRate: ['92.40'],
      currentDieselRate: ['92.40'],
      fuelComponent: [''],
      escalationLimitType: [null],
      deEscalationLimitType: [null],

      // BILLING INFORMATION
      billGenerationLoc: ['Mumbai - Andheri'],
      billSubmissionLoc: ['Mumbai - Andheri'],
      billCollectionLoc: ['Mumbai - Andheri'],
      billingState: ['Maharashtra'],
      comBusiness: ['2,50,000 / month'],
      billGenerationCycle: [null],
      maxDeduction: [''],
      billingInstance: [null],
      billingSchedule: [null],
      billingBase: ['Origin Base'],
      podType: [null],
      billSubmissionType: [null],

      // CREDIT DETAILS
      creditLimitActive: ['No', Validators.required],
      creditDays: [null],
      creditLimitRs: ['']
    });

    // Add initial ODA Custom Slab
    this.addOdaSlab();

    // Subscribe to cseName changes to auto-fill cseEmail
    this.qmForm.get('cseName')?.valueChanges.subscribe(userId => {
      if (userId && this.customerSupportUserDetailList) {
        const user = this.customerSupportUserDetailList.find(u => u.userId === userId);
        if (user) {
          this.qmForm.patchValue({ cseEmail: user.emailId });
        } else {
          this.qmForm.patchValue({ cseEmail: '' });
        }
      } else {
        this.qmForm.patchValue({ cseEmail: '' });
      }
    });
  }

  get commercialsArray() {
    return this.qmForm.get('commercials') as FormArray;
  }

  createSlabGroup(mode: string = 'ROAD CARGO') {
    return this.fb.group({
      from: ['> 0'],
      to: ['0'],
      transportMode: [mode],
      rateType: [null],
      rate: ['0.00'],
      stdTat: ['Auto'],
      custTat: ['']
    });
  }

  createValueAddedSlabGroup() {
    return this.fb.group({
      from: ['> 0'],
      to: ['0'],
      rateType: [null],
      rate: ['0.00']
    });
  }

  createValueAddedChargeGroup() {
    return this.fb.group({
      active: [false],
      slabType: [null],
      rateType: [null],
      rateValue: ['0.00'],
      minAmount: ['0.00'],
      maxAmount: ['999999'],
      slabs: this.fb.array([
        this.createValueAddedSlabGroup(),
        this.createValueAddedSlabGroup(),
        this.createValueAddedSlabGroup()
      ])
    });
  }

  createCommercialGroup(key: string) {
    const mode = key.split('-')[1] || 'ROAD CARGO';
    const defaultSlabs = this.fb.array([
      this.createSlabGroup(mode),
      this.createSlabGroup(mode),
      this.createSlabGroup(mode),
      this.createSlabGroup(mode)
    ]);

    const fg = this.fb.group({
      combinationKey: [key],
      freightCommercialsSlab: ['With Slab'],
      matrices: [null],
      fromState: [null], toState: [null],
      fromCity: [null], toCity: [null],
      fromPincode: [null], toPincode: [null],
      fromZone: [null], toZone: [null],
      slabs: defaultSlabs,
      freightRateType: [null],
      freightRate: ['0.00'],
      stdTat: [''],
      custTat: [''],
      valueAddedCharges: this.fb.group({}),
      loadingCharges: [false], loadingChargesType: [null],
      unloadingCharges: [false], unloadingChargesType: [null],
      minChargeableWeight: ['0'],
      minChargeablePkg: ['0'],
      minBasicFreight: [false], minBasicFreightValue: ['0']
    });

    const vacGroup = fg.get('valueAddedCharges') as FormGroup;
    this.valueAddedChargeKeys.forEach(charge => {
      vacGroup.addControl(charge.key, this.createValueAddedChargeGroup());
    });

    return fg;
  }

  toggleMatrix(rowIdx: number, colName: string) {
    const row: any = this.serviceMatrix[rowIdx];
    row[colName] = !row[colName];

    this.recalculateCombinations();
  }

  recalculateCombinations() {
    const modeDisplayMap: any = {
      road: 'ROAD CARGO', air: 'AIR', sample: 'SAMPLE', incineration: 'INCINERATION',
      coldChain: 'COLD CHAIN', ptl: 'PTL', superExpress: 'SUPER EXPRESS'
    };

    const newCombs: { service: string, mode: string, key: string }[] = [];
    
    this.serviceMatrix.forEach(row => {
      Object.keys(modeDisplayMap).forEach(key => {
        if ((row as any)[key]) {
          const service = row.name;
          const mode = modeDisplayMap[key];
          const combKey = `${service}-${mode}`;
          newCombs.push({ service, mode, key: combKey });
        }
      });
    });

    this.selectedCombinations = newCombs;

    // Sync FormArray
    const arr = this.commercialsArray;
    
    // Remove unselected
    for (let i = arr.length - 1; i >= 0; i--) {
      const g = arr.at(i) as FormGroup;
      if (!newCombs.find(c => c.key === g.get('combinationKey')?.value)) {
        arr.removeAt(i);
      }
    }

    // Add new
    newCombs.forEach(c => {
      const exists = arr.controls.find((g: any) => g.get('combinationKey')?.value === c.key);
      if (!exists) {
        arr.push(this.createCommercialGroup(c.key));
      }
    });

    if (this.selectedCombinations.length > 0) {
      if (!this.selectedCombinations.find(c => c.key === this.activeCombinationKey)) {
        this.activeCombinationKey = this.selectedCombinations[0].key;
      }
    } else {
      this.activeCombinationKey = '';
    }
  }

  setActiveCombination(key: string) {
    this.activeCombinationKey = key;
  }

  getActiveCommercialGroup(): FormGroup | null {
    if (!this.activeCombinationKey) return null;
    const arr = this.commercialsArray;
    return arr.controls.find((g: any) => g.get('combinationKey')?.value === this.activeCombinationKey) as FormGroup || null;
  }

  getActiveSlabsArray(): FormArray {
    const group = this.getActiveCommercialGroup();
    return group ? group.get('slabs') as FormArray : this.fb.array([]);
  }

  addSlab() {
    const group = this.getActiveCommercialGroup();
    if (group) {
      const mode = group.get('combinationKey')?.value.split('-')[1] || 'ROAD CARGO';
      this.getActiveSlabsArray().push(this.createSlabGroup(mode));
    }
  }

  removeSlab(index: number) {
    this.getActiveSlabsArray().removeAt(index);
  }

  addChargeSlab(chargeKey: string) {
    const group = this.getActiveCommercialGroup();
    if (group) {
      const chargeGroup = group.get('valueAddedCharges')?.get(chargeKey) as FormGroup;
      if (chargeGroup) {
        const slabs = chargeGroup.get('slabs') as FormArray;
        slabs.push(this.createValueAddedSlabGroup());
      }
    }
  }

  removeChargeSlab(chargeKey: string, index: number) {
    const group = this.getActiveCommercialGroup();
    if (group) {
      const chargeGroup = group.get('valueAddedCharges')?.get(chargeKey) as FormGroup;
      if (chargeGroup) {
        const slabs = chargeGroup.get('slabs') as FormArray;
        slabs.removeAt(index);
      }
    }
  }

  getChargeSlabs(chargeKey: string): FormArray {
    const group = this.getActiveCommercialGroup();
    if (group) {
      const chargeGroup = group.get('valueAddedCharges')?.get(chargeKey) as FormGroup;
      if (chargeGroup) return chargeGroup.get('slabs') as FormArray;
    }
    return this.fb.array([]);
  }

  isChargeActive(chargeKey: string): boolean {
    const group = this.getActiveCommercialGroup();
    return group?.get('valueAddedCharges')?.get(chargeKey)?.get('active')?.value === true;
  }

  getChargeSlabType(chargeKey: string): string | null {
    const group = this.getActiveCommercialGroup();
    return group?.get('valueAddedCharges')?.get(chargeKey)?.get('slabType')?.value || null;
  }

  getChargeColClass(chargeKey: string): string {
    if (this.isChargeActive(chargeKey)) {
      if (this.getChargeSlabType(chargeKey) === 'Without Slab') {
         return 'col-lg-3 col-md-4 col-sm-6'; 
      } else if (this.getChargeSlabType(chargeKey) === 'With Slab') {
         return 'col-12'; 
      }
    }
    return 'col-lg-2 col-md-3 col-sm-4'; 
  }

  goBack() {
    this.onBack.emit();
  }

  // --- ODA Custom Slab Helpers ---
  get odaCustomSlabs(): FormArray {
    return this.qmForm.get('odaPerKgCustomSlabs') as FormArray;
  }

  createOdaSlab(): FormGroup {
    return this.fb.group({
      from: [''],
      to: [''],
      categories: this.fb.array([
        this.createOdaCategory('A', 'Flat', '100', '1', '100', '99999'),
        this.createOdaCategory('B', 'Per Kg', '1', '2', '1000', '99999'),
        this.createOdaCategory('C', 'Per Kg', '2', '3', '2000', '99999'),
        this.createOdaCategory('D', 'Per Kg', '3', '4', '3000', '99999')
      ])
    });
  }

  createOdaCategory(category: string, rateType: string, rate: string, tat: string, min: string, max: string): FormGroup {
    return this.fb.group({
      category: [category],
      rateType: [rateType],
      rate: [rate],
      tat: [tat],
      min: [min],
      max: [max]
    });
  }

  addOdaSlab() {
    this.odaCustomSlabs.push(this.createOdaSlab());
  }

  removeOdaSlab(index: number) {
    if (this.odaCustomSlabs.length > 1) {
      this.odaCustomSlabs.removeAt(index);
    }
  }

  getOdaCategories(slabIndex: number): FormArray {
    return this.odaCustomSlabs.at(slabIndex).get('categories') as FormArray;
  }

  onSave() {
    if (this.qmForm.valid) {
      console.log('Form Submitted', this.qmForm.value, this.serviceMatrix);
      // API call would go here
    } else {
      this.qmForm.markAllAsTouched();
    }
  }

  getSigningLocation(){
    this.quotationService.signingLocation().subscribe({
      next:(res:any)=>{
        this.signingLocationList = res.data;
      }
    })
  }

  getPayBaseList() {
    this.expenseGeneralService.getGeneralMaster('','PAYTYP').subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.payBaseList = res.data;
        }
      }
    });
  }

  getCustomerSupportUserDetail(){
    this.quotationService.customerSupportUserDetail().subscribe({
      next:(res:any)=>{
        this.customerSupportUserDetailList = res.data;
      }
    })
  }

  fetchMasterLists() {
    this.quotationService.getState().subscribe({
      next: (res: any) => { if (res && res.data) this.stateList = res.data; }
    });
    this.quotationService.getCity().subscribe({
      next: (res: any) => { if (res && res.data) this.cityList = res.data; }
    });
    this.quotationService.getPincode().subscribe({
      next: (res: any) => { if (res && res.data) this.pincodeList = res.data; }
    });
    this.quotationService.getGeneralMasterData('ZONE').subscribe({
      next: (res: any) => { if (res && res.data) this.zoneList = res.data; }
    });
  }
}
