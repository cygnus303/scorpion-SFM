import { Component, inject, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeetingResponse, TodayScheduleData, MeetingOutcome } from '../../shared/models/meeting.model';
import { MeetingService } from '../../shared/services/meeting.service';
import { CommonService } from '../../shared/services/common.service';
import { IdentityService } from '../../shared/services/identity.service';
import { ExportService } from '../../shared/services/export.service';
import { FormsModule } from '@angular/forms';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { AddMeeting } from './add-meeting/add-meeting';
import { MeetingDetail } from './meeting-detail/meeting-detail';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationModule, NgSelectModule, PopoverModule, AddMeeting, MeetingDetail],
  templateUrl: './meeting-list.html',
  styleUrl: './meeting-list.scss'
})
export class MeetingList implements OnInit, OnDestroy {
  public meetings: MeetingResponse[] = [];
  public isLoading: boolean = false;
  public selectedUser: any = null;
  public totalItems: number = 0;
  public checkOutValue: any;
  public isExportLoading: boolean = false;
  public meetingCard: any;
  public todaySchedule: TodayScheduleData[] = [];
  public meetingOutcomes: MeetingOutcome[] = [];

  @ViewChild('addMeeting') addMeeting!: AddMeeting;
  @ViewChild('meetingDetail') meetingDetail!: MeetingDetail;

  public meetingService = inject(MeetingService);
  public commonService = inject(CommonService); // Public to access globalFilters in HTML
  private sweetAlertService = inject(SweetAlertService);
  private identityService = inject(IdentityService);
  private exportService = inject(ExportService);

  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getMeetings();
      this.onMeetingCard();
      this.fetchMeetingOutcomes();
    });
    this.fetchTodaySchedule();
    this.commonService.getUsers()
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        this.sweetAlertService.error(response);
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: any): void {
    this.getMeetings(event.page);
  }

  onDataEmitter() {
    this.getMeetings();
    this.onMeetingCard();
  }

  // getMeetingDetails(id: string, mode: 'edit' | 'view' = 'edit') {
  //   // Open the correct modal immediately
  //   if (mode === 'edit') {
  //     this.addMeeting.showPopup();
  //     this.addMeeting.isSubmitting = true;
  //   } else {
  //     this.meetingDetail.showPopup();
  //     this.meetingDetail.isLoading = true;
  //   }

  //   this.meetingService.getMeetingDetails(id, this.identityService.getLoggedUserId()).subscribe({
  //     next: (response) => {
  //       if (response) {
  //         if (mode === 'edit') {
  //           this.addMeeting.patchFormValues(response.data);
  //           this.addMeeting.isMeetingList = 'Update';
  //         } else {
  //           this.meetingDetail.patchData(response.data);
  //         }
  //       }
  //       this.addMeeting.isSubmitting = false;
  //       this.meetingDetail.isLoading = false;
  //     },
  //     error: (response: any) => {
  //       this.sweetAlertService.error(response);
  //       if (mode === 'edit') this.addMeeting.onClose();
  //       else this.meetingDetail.onClose();
  //     },
  //   });
  // }

  openMeetingModal(type: string, id?: string, checkOut?: string) {
    if (id) {
      this.addMeeting.isMeetingList = type;
      this.addMeeting.showPopup(() => {
        this.checkOutValue = checkOut;
        return this.meetingService.getMeetingDetails(id, this.commonService.globalFilters.UserID.toString());
      });
    } else {
      this.checkOutValue = '-';
      this.addMeeting.isMeetingList = type;
      this.addMeeting.showPopup();
    }
  }

  openMeetingDetailModal(meeting?: any) {
    this.meetingDetail.showPopup(() => {
      return this.meetingService.getMeetingDetails(meeting, this.identityService.getLoggedUserId());
    });
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
        this.sweetAlertService.error(response);
        this.isExportLoading = false;
      },
    });
  }

  onMeetingCard() {
    const params = {
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate,
      userId: this.commonService.globalFilters.UserID.toString(),
    }
    this.meetingService.meetingCard(params).subscribe({
      next: (response: any) => {
        if (response) {
          this.meetingCard = response.data;
        }
      },
      error: (response: any) => {
        this.sweetAlertService.error(response.error.message);
      },
    });
  }

  getOutcomePercentage(value: number): number {
    if (!this.meetingCard || !this.meetingCard.outcome || !this.meetingCard.outcome.totalMeetings || this.meetingCard.outcome.totalMeetings === 0) {
      return 0;
    }
    return Math.round((value / this.meetingCard.outcome.totalMeetings) * 100);
  }

  getOutcomeWidth(value: number): string {
    return `${this.getOutcomePercentage(value)}%`;
  }

  fetchTodaySchedule() {
    const userId = this.commonService.globalFilters.UserID.toString();
    this.meetingService.getTodaySchedule(userId).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.todaySchedule = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching today schedule:', error);
      }
    });
  }

  getDotClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'green';
      case 'in progress': return 'amber';
      case 'upcoming': return '';
      default: return '';
    }
  }

  getDotContent(status: string, index: number): string {
    switch (status.toLowerCase()) {
      case 'completed': return '✓';
      case 'in progress': return '!';
      default: return (index + 1).toString();
    }
  }

  fetchMeetingOutcomes() {
    const params = {
      startDate: this.commonService.globalFilters.startDate,
      endDate: this.commonService.globalFilters.endDate,
      userId: this.commonService.globalFilters.UserID.toString(),
    };
    this.meetingService.getMeetingOutcomes(params).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.meetingOutcomes = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching meeting outcomes:', error);
      }
    });
  }

  getOutcomeColor(name: string): string {
    if (!name) return 'var(--text3)';
    const lowerName = name.toLowerCase();
    if (lowerName.includes('positive') || lowerName.includes('won')) {
      return 'var(--green)';
    } else if (lowerName.includes('follow') || lowerName.includes('pending')) {
      return 'var(--amber)';
    } else {
      return 'var(--red)';
    }
  }

  getOutcomeClass(name: string): string {
    if (!name) return '';
    const lowerName = name.toLowerCase();
    if (lowerName.includes('positive') || lowerName.includes('won')) {
      return 'up';
    } else if (lowerName.includes('follow') || lowerName.includes('pending')) {
      return 'wn';
    } else {
      return 'dn';
    }
  }
}

