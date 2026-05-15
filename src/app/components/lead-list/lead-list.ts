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

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [CommonModule, AddLead, FormsModule, PaginationModule, NgSelectModule, PopoverModule, LeadDetail, AddMeeting],
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

    this.leadService.getLeadCards(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.leadCardsCard = response.data;
        }
        this.isExportLoading = false;
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

}
