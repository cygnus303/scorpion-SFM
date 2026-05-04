import { Component, Output, EventEmitter, OnInit, Inject, PLATFORM_ID, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonService } from '../../shared/services/common.service';
import { CalendarService } from '../../shared/services/calendar.service';
import { ToastrService } from 'ngx-toastr';
import { MeetingService } from '../../shared/services/meeting.service';
import { MeetingResponse } from '../../shared/models/meeting.model';
import { IdentityService } from '../../shared/services/identity.service';
import { AddMeeting } from '../meeting-list/add-meeting/add-meeting';

@Component({
  selector: 'app-my-calendar',
  imports: [FullCalendarModule, CommonModule, AddMeeting],
  templateUrl: './my-calendar.html',
  styleUrl: './my-calendar.scss',
})
export class MyCalendar implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  @ViewChild(AddMeeting) addMeetingComponent!: AddMeeting;
  private viewSubscription!: any;
  @Output() editMeeting = new EventEmitter<MeetingResponse>();
  selectedMeeting: MeetingResponse | null = null;
  public isMeeting: boolean = false;
  public isCall: boolean = false;
  public isBrowser: boolean = false;
  public isLoadingMeeting: boolean = false;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth', // Month view
    dayMaxEvents: false,      // important
    fixedWeekCount: false,    // extra empty rows remove કરે
    height: 'auto',
    headerToolbar: false,
    buttonText: {
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day',
    },
    events: [
      { title: 'Event 1', date: '2024-11-20' },
      { title: 'Event 2', date: '2024-11-21' },
    ],
    selectable: true,
    editable: true,
    eventClick: this.handleEventClick.bind(this), // Event click handler
  };

  handleEventClick(info: any) {
    if (this.isLoadingMeeting) return;

    if (info.event.extendedProps.isAllDayEvent === true) {
      this.toasterService.info('Meeting is booked for all day', '', {
        positionClass: 'toast-top-center'
      });
    }
    if (info.event.extendedProps.attendeeCode && info.event.extendedProps.isAllDayEvent === false) {
      this.editMeetingModal(info.event.extendedProps.attendeeCode);
    }
  }
  constructor(
    private commonService: CommonService,
    private toasterService: ToastrService,
    private meetingService: MeetingService,
    private calendarService: CalendarService,
    private identityService: IdentityService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.getCalendar();
    this.viewSubscription = this.commonService.calendarViewSubject.subscribe(type => {
      if (type === 'today') {
        this.changeView('timeGridDay');
        this.goToday();
      }
      else if (type === 'week') this.changeView('timeGridWeek');
      else if (type === 'month') this.changeView('dayGridMonth');
    });
  }

  ngOnDestroy() {
    if (this.viewSubscription) {
      this.viewSubscription.unsubscribe();
    }
  }

  getCalendar() {
    this.commonService.updateLoader(true);
    const filter = {
      userId: this.identityService.getLoggedUserId()
    }
    this.calendarService.getCalendar(filter).subscribe({
      next: (response) => {
        if (response) {
          this.calendarOptions.events = response.data;
        }
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.commonService.updateLoader(false);
      },
    });
  }

  changeView(view: string) {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.changeView(view);
  }

  goToday() {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.today();
  }

  goNext() {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.next();
  }

  goPrev() {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.prev();
  }

  closeEditMeetingModal() {
    this.getCalendar();
  }
  editMeetingModal(meetingId: string) {
    this.getMeeting(meetingId);
  }


  getMeeting(id: string) {
    this.isLoadingMeeting = true;
    this.commonService.updateLoader(true);
    this.meetingService.getMeetingDetails(id, this.identityService.getLoggedUserId()).subscribe({
      next: (response) => {
        if (response) {
          this.selectedMeeting = response.data;
          this.editMeeting.emit(response.data);
          this.addMeetingComponent.showPopup(response.data);
        }
        this.commonService.updateLoader(false);
        this.isLoadingMeeting = false;
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.commonService.updateLoader(false);
        this.isLoadingMeeting = false;
      },
    });
  }

  getEventColor(type: string): string {
    switch (type) {
      case 'work':
        return '#3498db'; // Blue
      case 'personal':
        return '#2ecc71'; // Green
      case 'urgent':
        return '#e74c3c'; // Red
      default:
        return '#95a5a6'; // Grey
    }
  }
}
