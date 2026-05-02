import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeetingResponse } from '../../shared/models/meeting.model';
import { MeetingService } from '../../shared/services/meeting.service';
import { CommonService } from '../../shared/services/common.service';
import { IdentityService } from '../../shared/services/identity.service';
import { ToastrService } from 'ngx-toastr';
import { ExportService } from '../../shared/services/export.service';
import { FormsModule } from '@angular/forms';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { AddMeeting } from './add-meeting/add-meeting';
import { MeetingDetail } from './meeting-detail/meeting-detail';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationModule, NgSelectModule, PopoverModule, AddMeeting, MeetingDetail],
  templateUrl: './meeting-list.html',
  styleUrl: './meeting-list.scss'
})
export class MeetingList implements OnInit {
  public meetings: MeetingResponse[] = [];
  public isLoading: boolean = false;
  public selectedUser: any = null;
  public totalItems: number = 0;
  public isExportLoading: boolean = false;
  @ViewChild('addMeeting') addMeeting!: AddMeeting;
  @ViewChild('meetingDetail') meetingDetail!: MeetingDetail;

  public meetingService = inject(MeetingService);
  public commonService = inject(CommonService); // Public to access globalFilters in HTML
  private toasterService = inject(ToastrService);
  private identityService = inject(IdentityService);
  private exportService = inject(ExportService);

  constructor() { }

  ngOnInit(): void {
    this.commonService.filterChanged$.subscribe(() => {
      this.getMeetings();
    });

    this.commonService.getUsers()
  }

  getMeetings(page: number = this.commonService.globalFilters.Page) {
    this.commonService.globalFilters.Page = page;
    const data = {
      Page: this.commonService.globalFilters.Page.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
      SearchFilter: this.commonService.globalFilters.searchText,
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate,
      userId: this.selectedUser || this.commonService.globalFilters.UserID.toString(),
      isWeb: true
    }
    this.isLoading = true;
    this.meetingService.getMeetingList(data).subscribe({
      next: (response: any) => {
        if (response) {
          this.meetings = response.data;
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
    this.getMeetings(event.page);
  }

  getMeetingDetails(id: string, mode: 'edit' | 'view' = 'edit') {
    // Open the correct modal immediately
    if (mode === 'edit') {
      this.addMeeting.showPopup();
      this.addMeeting.isSubmitting = true;
    } else {
      this.meetingDetail.showPopup();
      this.meetingDetail.isLoading = true;
    }

    this.meetingService.getMeetingDetails(id, this.identityService.getLoggedUserId()).subscribe({
      next: (response) => {
        if (response) {
          if (mode === 'edit') {
            this.addMeeting.patchFormValues(response.data);
            this.addMeeting.isMeetingList = 'Update';
          } else {
            this.meetingDetail.patchData(response.data);
          }
        }
        this.addMeeting.isSubmitting = false;
        this.meetingDetail.isLoading = false;
      },
      error: (response: any) => {
        this.toasterService.error(response);
        if (mode === 'edit') this.addMeeting.onClose();
        else this.meetingDetail.onClose();
      },
    });
  }

  openMeetingModal(meeting?: any) {
    this.addMeeting.showPopup(meeting);
  }

  openMeetingDetailModal(meeting?: any) {
    this.meetingDetail.showPopup(meeting);
  }

  downloadMeetings() {
    const startDate = this.commonService.globalFilters.startDate;
    const endDate = this.commonService.globalFilters.endDate;
    this.isExportLoading = true;
    this.meetingService.exportMeeting(this.selectedUser ? this.selectedUser : this.identityService.getLoggedUserId(), '', startDate, endDate).subscribe({
      next: (response: any) => {
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
