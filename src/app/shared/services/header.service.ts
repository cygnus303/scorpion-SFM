import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  private titleSignal = signal<string>('Dashboard');
  private subtitleSignal = signal<string>('All Modules Overview');

  private menuTitles: { [key: string]: { title: string; subtitle: string } } = {
    'dashboard': { title: 'Dashboard', subtitle: 'All Modules Overview' },
    'lead': { title: 'Lead Management', subtitle: 'Track and manage sales leads' },
    'meeting': { title: 'Meeting Management', subtitle: 'Schedule and track meetings' },
    'customer': { title: 'Customer Management', subtitle: 'Customer database and relationships' },
    'quotation': { title: 'Quotation Management', subtitle: 'QMS V2 - Quote Management System' },
    'prq': { title: 'Pickup Request', subtitle: 'PRQ - Pickup Request Management' },
    'expense': { title: 'Expense Management', subtitle: 'Track and manage expenses' },
    'expense-master': { title: 'Expense Master', subtitle: 'Expense General Master Settings' },
    'expense-approval': { title: 'Expense Approval', subtitle: 'Approve pending expenses' },
    'sales-dashboard': { title: 'Sales Dashboard', subtitle: 'Sales performance metrics' },
    'collection-dashboard': { title: 'Collection Dashboard', subtitle: 'Collection tracking and metrics' },
    'cs-dashboard': { title: 'CS Dashboard', subtitle: 'Customer Service Level Dashboard' },
    'complaint': { title: 'Complaint Management', subtitle: 'CCM - Customer Complaint Management' },
    'task': { title: 'Task Management', subtitle: 'Manage and track tasks' },
    'calendar': { title: 'My Calendar', subtitle: 'Personal calendar and schedule' },
    'training': { title: 'Training Hub', subtitle: 'Learning and development resources' },
    'call': { title: 'Call Management', subtitle: 'Track and manage calls' }
  };

  constructor() { }

  // Signal getters for reactive binding
  get title() {
    return this.titleSignal;
  }

  get subtitle() {
    return this.subtitleSignal;
  }

  updateHeader(title: string, subtitle: string = ''): void {
    this.titleSignal.set(title);
    this.subtitleSignal.set(subtitle || '');
  }

  updateHeaderFromMenu(menuKey: string): void {
    const menuInfo = this.menuTitles[menuKey];
    if (menuInfo) {
      this.updateHeader(menuInfo.title, menuInfo.subtitle);
    }
  }

  addMenuTitle(key: string, title: string, subtitle: string = ''): void {
    this.menuTitles[key] = { title, subtitle };
  }
}
