import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  private headerTitleSource = new BehaviorSubject<string>('Dashboard');
  headerTitle$ = this.headerTitleSource.asObservable();

  constructor() {}

  updateHeaderFromMenu(menuKey: string) {
    let title = '';
    switch (menuKey) {
      case 'Dashboard':
        title = 'Dashboard';
        break;
      case 'customer':
        title = 'Customer';
        break;
      case 'Lead':
        title = 'Lead';
        break;
      case 'Meeting':
        title = 'Meeting';
        break;
      case 'call':
        title = 'Call';
        break;
      case 'quotation':
        title = 'Quotation — QMS V2';
        break;
      case 'pickup-request':
        title = 'PRQ — Pickup Request';
        break;
      case 'expense':
        title = 'Expense';
        break;
      case 'expense-master':
        title = 'Expense General Master';
        break;
      case 'expense-approval':
        title = 'Expense Approval';
        break;
      case 'sales-dashboard':
        title = 'Sales Dashboard';
        break;
      case 'collection-dashboard':
        title = 'Collection Dashboard';
        break;
      case 'cs-dashboard':
        title = 'CS Level Dashboard';
        break;
      case 'complaint':
        title = 'Complaint (CCM)';
        break;
      case 'task':
        title = 'Task';
        break;
      case 'calendar':
        title = 'My Calendar';
        break;
      case 'training':
        title = 'Training Hub';
        break;
      default:
        title = 'Dashboard';
    }
    this.headerTitleSource.next(title);
  }

  updateHeader(title: string) {
    this.headerTitleSource.next(title);
  }
}
