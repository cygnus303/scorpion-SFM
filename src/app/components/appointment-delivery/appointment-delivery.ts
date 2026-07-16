import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddAppointment } from './add-appointment/add-appointment';
import { ViewAppointment } from './view-appointment/view-appointment';

interface AppointmentItem {
  id: string;
  customer: string;
  docketNo: string;
  orgDest: string;
  dateTime: string;
  status: 'Generated' | 'Rescheduled';
  statusClass: string;
  type: 'Appointment' | 'CSD' | 'Mall';
}

@Component({
  selector: 'app-appointment-delivery',
  standalone: true,
  imports: [CommonModule, AddAppointment, ViewAppointment],
  templateUrl: './appointment-delivery.html',
  styleUrl: './appointment-delivery.scss',
})
export class AppointmentDelivery implements OnInit {
  @ViewChild('addAppointmentModal') addAppointmentModal!: AddAppointment;
  @ViewChild('viewAppointmentModal') viewAppointmentModal!: ViewAppointment;
  activeTab: 'Appointment' | 'CSD' | 'Mall' = 'Appointment';

  appointments: AppointmentItem[] = [
    // Appointment Delivery
    {
      id: 'APT-0312',
      customer: 'Reliance Freight',
      docketNo: 'C49281520',
      orgDest: 'Mumbai North → Pune',
      dateTime: '22/06/2026 10:00 AM–11:00 AM',
      status: 'Generated',
      statusClass: 'pg',
      type: 'Appointment'
    },
    {
      id: 'APT-0311',
      customer: 'Sunrise Traders',
      docketNo: 'C49281519',
      orgDest: 'Pune → Mumbai South',
      dateTime: '22/06/2026 11:30 AM–12:30 PM',
      status: 'Rescheduled',
      statusClass: 'pa',
      type: 'Appointment'
    },
    {
      id: 'APT-0310',
      customer: 'Nexus Logistics',
      docketNo: 'C49281518',
      orgDest: 'Thane → Mumbai North',
      dateTime: '22/06/2026 02:00 PM–03:00 PM',
      status: 'Generated',
      statusClass: 'pg',
      type: 'Appointment'
    },
    {
      id: 'APT-0309',
      customer: 'BlueDart Corp',
      docketNo: 'C49281517',
      orgDest: 'Mumbai South → Nashik',
      dateTime: '21/06/2026 04:00 PM–05:00 PM',
      status: 'Generated',
      statusClass: 'pg',
      type: 'Appointment'
    },
    // CSD Delivery
    {
      id: 'CSD-0210',
      customer: 'Army Canteen Stores',
      docketNo: 'C49281601',
      orgDest: 'Mumbai North → Deolali CSD',
      dateTime: '23/06/2026 09:00 AM–10:30 AM',
      status: 'Generated',
      statusClass: 'pg',
      type: 'CSD'
    },
    {
      id: 'CSD-0209',
      customer: 'Naval Depot Supply',
      docketNo: 'C49281602',
      orgDest: 'Thane → Colaba Depot',
      dateTime: '23/06/2026 11:00 AM–12:00 PM',
      status: 'Generated',
      statusClass: 'pg',
      type: 'CSD'
    },
    {
      id: 'CSD-0208',
      customer: 'Air Force Canteen',
      docketNo: 'C49281603',
      orgDest: 'Pune → Lohegaon CSD',
      dateTime: '22/06/2026 03:00 PM–04:00 PM',
      status: 'Rescheduled',
      statusClass: 'pa',
      type: 'CSD'
    },
    // Mall Delivery
    {
      id: 'MALL-0115',
      customer: 'Phoenix Palladium',
      docketNo: 'C49281701',
      orgDest: 'Bhiwandi → Lower Parel',
      dateTime: '23/06/2026 06:00 AM–08:00 AM',
      status: 'Generated',
      statusClass: 'pg',
      type: 'Mall'
    },
    {
      id: 'MALL-0114',
      customer: 'Inorbit Mall Retail',
      docketNo: 'C49281702',
      orgDest: 'Mumbai North → Malad West',
      dateTime: '23/06/2026 07:00 AM–09:00 AM',
      status: 'Generated',
      statusClass: 'pg',
      type: 'Mall'
    },
    {
      id: 'MALL-0113',
      customer: 'Viviana Mall Supply',
      docketNo: 'C49281703',
      orgDest: 'Thane → Thane West',
      dateTime: '22/06/2026 08:30 AM–10:00 AM',
      status: 'Generated',
      statusClass: 'pg',
      type: 'Mall'
    }
  ];

  ngOnInit(): void { }

  setTab(tab: 'Appointment' | 'CSD' | 'Mall') {
    this.activeTab = tab;
  }

  get filteredAppointments(): AppointmentItem[] {
    return this.appointments.filter(item => item.type === this.activeTab);
  }

  get totalAppointmentCount(): number {
    return this.appointments.filter(i => i.type === 'Appointment').length;
  }

  get todayAppointmentCount(): number {
    return 0;
  }

  get rescheduledAppointmentCount(): number {
    return this.appointments.filter(i => i.type === 'Appointment' && i.status === 'Rescheduled').length;
  }

  get totalCsdCount(): number {
    return this.appointments.filter(i => i.type === 'CSD').length;
  }

  get totalMallCount(): number {
    return this.appointments.filter(i => i.type === 'Mall').length;
  }

  openAddModal() {
    this.addAppointmentModal.openModal(this.activeTab);
  }

  openViewModal(item: AppointmentItem) {
    this.viewAppointmentModal.openModal(item);
  }

  formatDate(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ');
    return parts[0] || '';
  }

  formatTime(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ');
    if (parts.length >= 2) {
      return parts.slice(1).join(' ').replace(/\s*[–—-]\s*/g, ' — ');
    }
    return '';
  }

  splitOrgDest(orgDest: string): { org: string; dest: string } {
    if (!orgDest) return { org: '', dest: '' };
    const parts = orgDest.split(/\s*→\s*|\s*->\s*/);
    return {
      org: parts[0] || orgDest,
      dest: parts[1] || ''
    };
  }
}
