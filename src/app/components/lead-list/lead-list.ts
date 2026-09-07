import { Component, OnInit, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddLead } from './add-lead/add-lead';
import { FormsModule } from '@angular/forms';
import { BsModalService } from 'ngx-bootstrap/modal';
import { LeadService } from '../../shared/services/lead.service';
import { CommonService } from '../../shared/services/common.service';
import { IdentityService } from '../../shared/services/identity.service';
import { ToastrService } from 'ngx-toastr';
import { LeadResponse } from '../../shared/models/lead.model';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { LeadDetail } from './lead-detail/lead-detail';
import { ExportService } from '../../shared/services/export.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExternalService } from '../../shared/services/external.service';
import { GeneralMasterResponse } from '../../shared/models/external.model';
import { AddMeeting } from '../meeting-list/add-meeting/add-meeting';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [CommonModule, AddLead, FormsModule, PaginationModule, NgSelectModule, PopoverModule, LeadDetail, AddMeeting, CountUpDirective],
  templateUrl: './lead-list.html',
  styleUrl: './lead-list.scss',
  providers: [BsModalService]
})
export class LeadList implements OnInit, OnDestroy {
  @ViewChild('addLeadComponent') addLeadComponent!: AddLead;
  @ViewChild('leadDetailComponent') leadDetailComponent!: LeadDetail;
  @ViewChild('addMeeting') addMeeting!: AddMeeting;

  public leads: LeadResponse[] = [];
  public totalItems: number = 0;
  public isExportLoading: boolean = false;
  public isLoading: boolean = false;
  public selectedUser: any = null;
  public selectedLeadCategory: any = null;
  public leadCategories: GeneralMasterResponse[] = [];
  public leadCardsCard: any;
  public isCardsLoading: boolean = false;
  selectedFile: File | null = null;


  private leadService = inject(LeadService);
  public commonService = inject(CommonService); // Public to access globalFilters in HTML
  private toasterService = inject(ToastrService);
  private identityService = inject(IdentityService);
  private exportService = inject(ExportService);
  private externalService = inject(ExternalService);

  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getLeads();
      this.getLeadCards();
    });
    this.getLeadCategories();
    this.commonService.getUsers()
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getLeads(page: number = this.commonService.globalFilters.Page) {
    this.commonService.globalFilters.Page = page;
    const data = {
      filters: {
        Page: this.commonService.globalFilters.Page.toString(),
        PageSize: this.commonService.globalFilters.PageSize.toString(),
        SearchFilter: this.commonService.globalFilters.searchText,
        LeadCategory: this.selectedLeadCategory || ''
      },
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate,
      userId: this.selectedUser || this.commonService.globalFilters.UserID.toString()
    }
    this.isLoading = true;
    this.leadService.getLeadList(data).subscribe({
      next: (response: any) => {
        if (response) {
          this.leads = response.data;
          this.totalItems = response.totalCount;
        }
        this.isLoading = false;
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: any): void {
    this.getLeads(event.page);
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

  getLead(leadCode: string, mode: 'edit' | 'view' = 'edit') {
    this.leadService.getLeadDetails(leadCode, this.identityService.getLoggedUserId()).subscribe({
      next: (response) => {
        if (response) {
          if (mode === 'edit') {
            this.openLeadModal(response.data);
          } else {
            this.openLeadDetailModal(response.data);
          }
        }
      },
      error: (response: any) => {
        this.toasterService.error(response);
      },
    });
  }

  openLeadModal(id?: any) {
    if (id) {
      this.addLeadComponent.showPopup(() => {
        return this.leadService.getLeadDetails(id, this.commonService.globalFilters.UserID.toString());
      });
    } else {
      this.addLeadComponent.showPopup();
    }
  }

  meetingModal(lead: any) {
    this.addMeeting.showPopup(undefined, lead);
  }


  openLeadDetailModal(lead?: any) {
    this.leadDetailComponent.showPopup(() => {
      return this.leadService.getLeadDetails(lead, this.identityService.getLoggedUserId());
    });
  }

  onDataEmitter() {
    this.getLeads();
    this.getLeadCards();
  }

  downloadLeads() {
    const startDate = this.commonService.globalFilters.startDate;
    const endDate = this.commonService.globalFilters.endDate;
    this.isExportLoading = true;
    this.leadService.exportLead(startDate, endDate, this.selectedUser ? this.selectedUser : this.identityService.getLoggedUserId(), '').subscribe({
      next: (response) => {
        if (response) {
          this.exportService.exportToExcel(response.data);
        }
        this.isExportLoading = false;
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.isExportLoading = false;
      },
    });
  }

  getLeadCards() {
    const params = {
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate,
      userId: this.commonService.globalFilters.UserID.toString(),
    }

    this.isCardsLoading = true;
    this.leadService.getLeadCards(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.leadCardsCard = response.data;
        }
        this.isCardsLoading = false;
      },
      error: () => {
        this.isCardsLoading = false;
      }
    });
  }

  getFunnelWidth(value: number): string {
    if (!this.leadCardsCard || !this.leadCardsCard.funnel_Lead || this.leadCardsCard.funnel_Lead === 0) {
      return value > 0 ? '100%' : '0%';
    }
    const percentage = (value / this.leadCardsCard.funnel_Lead) * 100;
    return `${percentage}%`;
  }

   downloadSampleImport(event: any) {
    event.preventDefault();
    this.leadService.downloadSampleLeadUpload(this.identityService.getLoggedUserId()).subscribe({
      next: (response: Blob) => {
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'LeadImport.xlsx';
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.commonService.updateLoader(false);
      },
    });
  }

    triggerFileInput(event: Event, disappointed: void) {
    event.preventDefault();
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  onFileChange(event: any) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];


    if (file) {
      const validExcelTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'application/vnd.ms-excel', // XLS
        'text/csv', // CSV
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // XLSB
        'application/vnd.ms-excel.sheet.macroEnabled.12', // XLSM
        'application/vnd.openxmlformats-officedocument.spreadsheetml.template', // XLTX
        'application/vnd.ms-excel.template.macroEnabled.12', // XLTM
      ];
      if (validExcelTypes.includes(file.type)) {
        this.selectedFile = file;
        const formData = new FormData();
        formData.append('file', file);
        this.importLead(formData);
      } else {
        this.toasterService.error(
          'Please upload a valid excel file (XLSX, XLS, or CSV).'
        );
        this.selectedFile = null;
      }
      fileInput.value = '';
    }
  }
  importLead(dataToSubmit: any): void {
    this.commonService.updateLoader(true);

    this.leadService.importLead(this.identityService.getLoggedUserId(), dataToSubmit).subscribe({
      next: (response) => {
        this.commonService.updateLoader(false);

        if (response.success) {
          const invalidLeads = response.data.filter((lead: any) => lead.IsValid === false);

          if (invalidLeads.length > 0) {
            this.toasterService.error(`Import completed with ${invalidLeads.length} invalid record(s). Downloading error file...`);
            this.getLeads();
            this.downloadInvalidLeadsExcel(invalidLeads);
          } else {
            this.toasterService.success(response.data[0]?.Message || 'Lead(s) Created Successfully');
            this.getLeads();
          }
        } else {
          this.toasterService.error(response.error?.message || 'Import failed.');
        }
      },
      error: (error: any) => {
        this.toasterService.error(error.message || 'An error occurred during import.');
        this.commonService.updateLoader(false);
      },
    });
  }

    downloadInvalidLeadsExcel(invalidLeads: any[]): void {
    const cleanedLeads = invalidLeads.map(({ IsValid, ...rest }) => rest);

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(cleanedLeads, {
      skipHeader: false,
    });

    const workbook: XLSX.WorkBook = {
      Sheets: { 'Invalid Leads': worksheet },
      SheetNames: ['Invalid Leads'],
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    FileSaver.saveAs(blob, `Invalid_Leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }


}
