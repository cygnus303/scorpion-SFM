import { Component, OnInit, ViewChild, inject } from '@angular/core';
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

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [CommonModule, AddLead, FormsModule, PaginationModule, NgSelectModule, PopoverModule, LeadDetail],
  templateUrl: './lead-list.html',
  styleUrl: './lead-list.scss',
  providers: [BsModalService]
})
export class LeadList implements OnInit {
  @ViewChild('addLeadComponent') addLeadComponent!: AddLead;
  @ViewChild('leadDetailComponent') leadDetailComponent!: LeadDetail;

  public leads: LeadResponse[] = [];
  public totalItems: number = 0;
  public isExportLoading: boolean = false;

  private leadService = inject(LeadService);
  public commonService = inject(CommonService); // Public to access globalFilters in HTML
  private toasterService = inject(ToastrService);
  private identityService = inject(IdentityService);
  private exportService = inject(ExportService);

  constructor() { }

  ngOnInit(): void {
    this.commonService.filterChanged$.subscribe(() => {
      this.getLeads();
    });

    this.commonService.getUsers()
  }

  public isLoading: boolean = false;
  public selectedUser: any = null;

  getLeads(page: number = this.commonService.globalFilters.Page) {
    this.commonService.globalFilters.Page = page;
    const data = {
      filters: {
        Page: this.commonService.globalFilters.Page.toString(),
        PageSize: this.commonService.globalFilters.PageSize.toString(),
        SearchFilter: this.commonService.globalFilters.searchText
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

  openLeadModal(lead?: any) {
    this.addLeadComponent.showPopup(lead);
  }

  openLeadDetailModal(lead?: any) {
    this.leadDetailComponent.showPopup(lead);
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

}
