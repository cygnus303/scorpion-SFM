import { Component } from '@angular/core';
import { MeetingMoMListResponse, MeetingMoMResponse } from '../../shared/models/meeting.model';
import { MeetingService } from '../../shared/services/meeting.service';
import { CommonService } from '../../shared/services/common.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { IdentityService } from '../../shared/services/identity.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-meeting-mom-list',
  imports: [CommonModule, RouterModule, FormsModule, NgSelectModule, PaginationModule],
  templateUrl: './meeting-mom-list.html',
  styleUrl: './meeting-mom-list.scss',
})
export class MeetingMomList {
  public meetingMom: MeetingMoMResponse[] = [];
  public MOMList: MeetingMoMListResponse[] = [];
  public loading: boolean = false;
  public totalItems = 0;

  public selectedMeetingId: string | null = null;
  private destroy$ = new Subject<void>();
  constructor(
    private meetingService: MeetingService,
    public commonService: CommonService,
    private identityService: IdentityService,
    private sweetAlertService: SweetAlertService,
  ) {}

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getMeetingMom();
      this.getMeetingMOMList()
    });
  }

   ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getMeetingMom() {
    this.meetingService.getMeetingMomDetails().subscribe({
      next: (response) => {
        if (response) {
          this.meetingMom = response.data;
        }
      }
    });
  }

  startEdit(item: any) {
    this.selectedMeetingId = item.meetingId;
  }

  cancelEdit() {
    this.selectedMeetingId = null;
  }


  isRowActive(item: any): boolean {
    return this.selectedMeetingId === item.meetingId;
  }

  getMeetingMOMList(page: number = this.commonService.globalFilters.Page) {
     this.commonService.globalFilters.Page = page;
    const filters: any = {
      Page: this.commonService.globalFilters.Page.toString(),
      PageSize: this.commonService.globalFilters.PageSize.toString(),
    };
    this.meetingService.getMOMList(this.identityService.getLoggedUserId(), filters).subscribe({
      next: (response) => {
        if (response) {
          this.MOMList = response.data.map((item: any) => ({
            ...item,
            meetingMOM: item.meetingMOM === '' ? null : item.meetingMOM
          }));
          this.totalItems = response.totalCount;
        }
      }
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
        }
      });
    }
  }
}
