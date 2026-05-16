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
  public sidebarTodayEvents: any[] = [];
  public sidebarUpcomingEvents: any[] = [];
  public currentFormattedDate: string = '';

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
    this.setCurrentDate();
  }

  setCurrentDate() {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    this.currentFormattedDate = now.toLocaleDateString('en-US', options);
  }

  ngOnInit() {
    this.getCalendar();
    this.getUpcomingDetail();
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
        if (response && response.data) {
          this.calendarOptions.events = response.data;
          this.filterSidebarEvents(response.data);
        }
        this.commonService.updateLoader(false);
      },
      error: (response: any) => {
        this.toasterService.error(response);
        this.commonService.updateLoader(false);
      },
    });
  }

  filterSidebarEvents(events: any[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    this.sidebarTodayEvents = events.filter(event => {
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });

    this.sidebarUpcomingEvents = events.filter(event => {
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today && eventDate <= endOfWeek;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
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
    this.addMeetingComponent.showPopup(() => {
      return this.meetingService.getMeetingDetails(meetingId, this.identityService.getLoggedUserId());
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

  getEventTime(dateStr: string): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  getEventDate(dateStr: string): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getUpcomingDetail() {
    this.calendarService.getUpcomingWeek(this.identityService.getLoggedUserId()).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.sidebarUpcomingEvents = response.data;
        }
      },
      error: (response: any) => {
        this.toasterService.error(response);
      },
    });
  }
}
