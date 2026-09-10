import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../shared/services/dashboard';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-lr-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lr-view.html',
  styleUrl: './lr-view.scss'
})
export class LrView {
  public showModal: boolean = false;
  public isLoading: boolean = false;

  // Data matching the screenshot exactly
  public data = {
    gcnNo: '63486068',
    contractId: 'CN0000030506',
    billingParty: 'RAGHUNATH TRADING SOLUTIONS (SME)',
    billingCode: 'C01150353',
    pan: 'AAJCS7860C',
    serviceZone: 'NORTH 1 - WEST 1',
    serviceType: 'LTL',
    movementType: '—',
    modeOfMovement: '—',
    dateOfBooking: '09 Sep 2026',
    dateOfShipping: '09 Sep 2026',
    expectedDeliveryDate: '30 Sep 2026',
    carrierRisk: 'Owner Risk',
    isAudited: 'No',

    consignor: {
      name: 'RAGHUNATH TRADING SOLUTIONS',
      gstin: '—',
      location: 'GGN :GURUGRAM',
      phone: '—',
      pinCode: '122503',
      date: '09 Sep 2026'
    },
    consignee: {
      name: 'RAGHUNATH TRADING SOLUTIONS',
      gstin: '—',
      address: 'GAT NO 584/1/2 KOREGAON BHIMA, SHIRUR PUNE M AHARASHTRA 412208',
      pinCode: '412208',
      phone: '—'
    },
    origin: {
      code: 'GGN',
      city: 'GURUGRAM',
      cityZone: 'NORTH 1',
      zoneMatrix: 'New Zone'
    },
    destination: {
      code: 'WGL',
      city: 'WAGHOLI',
      cityZone: 'WEST 1',
      rateType: 'Per KG',
      rate: '8',
      pinCode: '412208'
    },
    shipmentInfo: {
      packages: '13',
      packingMethod: 'CARTON BOX',
      actualWt: '130',
      chargedWt: '130',
      goodsType: '—',
      deliveryTerms: 'DOOR PICKUP TO DOOR DELIVERY'
    },
    processing: {
      localDocket: 'N',
      oda: 'Y',
      volumetric: 'Y',
      bulkInvoke: 'N',
      exemptionService: 'N / -',
      bulkInvokeBy: '—',
      bulkInvokeDate: '—',
      sourceCnote: '—'
    },
    appointment: {
      no: 'APMT/GGN/2627/002162',
      dateTime: '30 Sep 2026',
      entryBy: '4351 : SUDHIR KUMAR',
      entryDate: '09 Sep 2026',
      updateBy: '—',
      updateDate: '—'
    },
    csd: {
      deliveryId: '—',
      dateTime: '—',
      entryBy: '—',
      mallDeliveryId: '—',
      mallDateTime: '—',
      mallEntryBy: '—'
    },
    invoice: {
      no: 'R26-27/08102',
      date: '08 Sep 2026',
      ewaybillNo: '342329783072',
      ewaybillExpiry: '15 Sep 2026',
      declaredValue: '₹ 116,809.00',
      specialInstructions: '—'
    },
    entryBox: {
      srNo: '1',
      length: '15',
      breadth: '12',
      height: '10',
      packages: '13',
      cubicWeight: '0.36',
      actualWeight: '130',
      cftRatio: '81.25'
    },
    charges: {
      basicFreight: '1,040.00',
      otherCharges: '0.00',
      documentCharges: '125',
      extraHandling: '0.00',
      specialCharges: '0.00',
      odaCharges: '1500',
      fovCharges: '75',
      csdDelivery: '0.00',
      jAndKDelivery: '0.00',
      pickupCharges: '0.00',
      cartageCharges: '0.00',
      mallDelivery: '0.00',
      extraDelivery: '0.00',
      northEastCharges: '0.00',
      greenTax: '0.00',
      sikkimTax: '0.00',
      varaiCharges: '0.00',
      westBengalDelivery: '0.00',
      dieselHike: '43.78',
      keralaCharges: '0.00',
      unloadingCharges: '0.00',
      secondAttempt: '0.00',
      loadingCharges: '0.00',
      toPayCharges: '0.00',
      appointmentCharges: '500',
      fuelSurcharge: '114.4',
      discountRateType: '—',
      discountRatePerc: '0.00',
      discount: '0.00',
      totalFreight: '3398.18'
    },
    tax: {
      sgst: '₹ 305.84',
      tgst: '₹ 0',
      cgst: '₹ 305.84',
      igst: '₹ 0.00'
    },
    totalAmount: '₹ 4009.85',
    audit: {
      addedBy: 'D1584:DHARMENDRA',
      addedDate: '08 Sep 2026',
      editedBy: '—',
      editedDate: '09 Sep 2026',
      completedBy: '4351:SUDHIR KUMAR',
      completedDate: '09 Sep 2026',
      cancelledBy: '—',
      cancelledDate: '—',
      auditedBy: '—',
      auditedDate: '—'
    },
    payment: {
      terms: 'TBB',
      bankName: 'HDFC BANK',
      branch: 'PRABHADEVI',
      accountNo: '50200033944301',
      ifscCode: 'HDFC0000012',
      gstPayableBy: 'Third Party'
    }
  };

  // open(searchNo?: string) {
  //   this.showModal = true;
  //   document.body.style.overflow = 'hidden';
    
  //   if (searchNo) {
  //     this.fetchData(searchNo);
  //   }
  // }

  close() {
    this.showModal = false;
    document.body.style.overflow = 'auto';
  }

  fetchData(searchNo: string) {
    this.isLoading = true;
    this.dashboardService.getTrackingDetail(searchNo).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const resultData = res.data || res.Data || res.result || res;
        console.log('LR View API Response:', resultData); // For debugging exact property names

        if (resultData && resultData.HeaderMeta && resultData.HeaderMeta.length > 0) {
          const header = resultData.HeaderMeta[0];
          
          // Map properties based on the actual API response
          // Note: Since the exact property names are unknown, we map common conventions
          // Update these keys based on the console.log output if needed.
          
          this.data.gcnNo = header.dockno || searchNo;
          this.data.contractId = header.ContractId || header.contract_id || '—';
          this.data.billingParty = header.BillingParty || header.billing_party || '—';
          this.data.billingCode = header.BillingCode || header.billing_code || '—';
          this.data.pan = header.PAN || header.pan || '—';
          this.data.serviceZone = header.ServiceZone || header.service_zone || '—';
          this.data.serviceType = header.ServiceType || header.service_type || '—';
          this.data.movementType = header.MovementType || header.movement_type || '—';
          this.data.modeOfMovement = header.TransportMode || header.mode_of_movement || '—';
          this.data.dateOfBooking = header.dockdt || '—';
          this.data.dateOfShipping = header.ShippingDate || '—';
          this.data.expectedDeliveryDate = header.EDD || '—';
          this.data.carrierRisk = header.CarrierRisk || '—';
          this.data.isAudited = header.IsAudited || 'No';

          // Consignor
          this.data.consignor.name = header.Cnor || header.consignor_name || '—';
          this.data.consignor.gstin = header.CnorGSTIN || header.consignor_gstin || '—';
          this.data.consignor.location = header.Origin_dest ? header.Origin_dest.split('-')[0] : '—';
          
          // Consignee
          this.data.consignee.name = header.Cnee || header.consignee_name || '—';
          this.data.consignee.gstin = header.CneeGSTIN || header.consignee_gstin || '—';
          this.data.consignee.address = header.CneeAddress || '—';

          // Origin & Destination
          this.data.origin.code = header.Origin || '—';
          this.data.destination.code = header.destcd || '—';

          // Charges (guess matching standard fields)
          this.data.charges.basicFreight = header.BasicFreight || header.basic_freight || '0.00';
          this.data.charges.totalFreight = header.TotalFreight || header.total_freight || '0.00';
          this.data.totalAmount = header.TotalAmount || header.total_amount || '0.00';
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error fetching LR details:', err);
      }
    });
  }

  public modalRef!: BsModalRef;
  @ViewChild('TemplateRef', { static: true }) TemplateRef!: TemplateRef<any>;

  constructor(private modalService: BsModalService,private dashboardService: DashboardService) { }

  public lrDetails: any = null;
  public boxDetails: any[] = [];

  showPopup(row: any) {
    if (!row) return;
    this.lrDetails = null;
    this.boxDetails = [];
    this.isLoading = true;
    this.modalRef = this.modalService.show(this.TemplateRef, { class: 'modal-xl modal-dialog-centered hcc-view-modal-custom', backdrop: true });

    this.dashboardService.getDocketDetail(row).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res) {
          const data = res;
          this.lrDetails = data.Header || null;
          this.boxDetails = data.BoxDetails || [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error fetching LR details', err);
      }
    });
  }



  parseDate(val: any): any {
    if (!val) return val;
    // Handle specific string format "dd/MM/yyyy HH:mm"
    if (typeof val === 'string') {
      const parts = val.trim().split(' ');
      const datePart = parts[0];
      const timePart = parts[1] || '00:00:00';
      const dateParts = datePart.split('/');
      if (dateParts.length === 3) {
        // Assume dd/MM/yyyy => return yyyy-MM-ddTHH:mm:ss for standard Date parsing
        return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timePart}`;
      }
    }
    return val;
  }

}
