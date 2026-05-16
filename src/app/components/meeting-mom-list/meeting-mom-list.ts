import { Component } from '@angular/core';
import { MeetingMoMListResponse, MeetingMoMResponse } from '../../shared/models/meeting.model';
import { MeetingService } from '../../shared/services/meeting.service';
import { CommonService } from '../../shared/services/common.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { IdentityService } from '../../shared/services/identity.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-meeting-mom-list',
  imports: [CommonModule, RouterModule, FormsModule, NgSelectModule, PaginationModule],
  templateUrl: './meeting-mom-list.html',
  styleUrl: './meeting-mom-list.scss',
})
export class MeetingMomList {
  public meetingMom: MeetingMoMResponse[] = [];
  public MOMList: MeetingMoMListResponse[] = [];
  public filters: { [key: string]: string } = {};
  public loading: boolean = false;
  page = 1;
  pageSize = 10;
  totalItems = 0;
  timeoutRef: any;

  public selectedMeetingId: string | null = null;

  constructor(
    private meetingService: MeetingService,
    public commonService: CommonService,
    private identityService: IdentityService,
    private sweetAlertService: SweetAlertService,
  ) {

  }


  ngOnInit(): void {
    this.getMeetingMom();
    this.getMeetingMOMList()
  }

  onfilterList() {
    clearTimeout(this.timeoutRef);
    this.timeoutRef = setTimeout(() => {
      this.getMeetingMOMList();
    }, 500);
  }

  getMeetingMom() {
    this.commonService.updateLoader(true);
    this.meetingService.getMeetingMomDetails().subscribe({
      next: (response) => {
        if (response) {
          this.meetingMom = response.data;
        }
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.commonService.updateLoader(false);
      },
    });
  }

  onMeetingClick(meetingId: string) {
    this.selectedMeetingId = meetingId;
  }

  startEdit(item: any) {
    this.selectedMeetingId = item.meetingId;
  }

  cancelEdit() {
    this.selectedMeetingId = null;
  }

  clearDate() {
    this.filters['MeetingDate'] = '';
    this.getMeetingMOMList();
  }


  isRowActive(item: any): boolean {
    return this.selectedMeetingId === item.meetingId;
  }

  getMeetingMOMList(page: number = 1) {
    this.filters = Object.fromEntries(
      Object.entries(this.filters).filter(([key, value]) => value !== null)
    );
    const filters: any = {
      ...this.filters,
      Page: page,
      PageSize: this.pageSize,
      MeetingDate: this.filters['MeetingDate'] ? this.commonService.formatDate(new Date(this.filters['MeetingDate'])) : ''
    };
    this.meetingService.getMOMList(this.identityService.getLoggedUserId(), filters).subscribe({
      next: (response) => {
        if (response) {
          // this.MOMList = response.data;
          this.MOMList = response.data.map((item: any) => ({
            ...item,
            meetingMOM: item.meetingMOM === '' ? null : item.meetingMOM
          }));
          this.totalItems = response.totalCount;
        }
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.commonService.updateLoader(false);
      },
    });
  }

  onPageChange(event: any) {
    this.getMeetingMOMList(event.page);
  }

  onSubmit(item: any) {
    if (item.meetingMOM && item.remarks) {
      const payload = {
        meetingId: item.meetingId,
        meetingMOM: item.meetingMOM.join(','),
        remarks: item.remarks
      }
      this.meetingService.onSubmitMOM(this.identityService.getLoggedUserId(), payload).subscribe({
        next: (response) => {
          if (response.data.status === 1) {
            this.sweetAlertService.success(response.data.message);
            this.getMeetingMOMList();
          }
          this.commonService.updateLoader(false);
        },
        error: (response: any) => {
          this.commonService.updateLoader(false);
        },
      });
    }
  }
}
