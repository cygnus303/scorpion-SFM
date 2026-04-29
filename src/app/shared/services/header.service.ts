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
      case 'prq':
        title = 'PRQ — Pickup Req';
        break;
      case 'expense':
        title = 'Expense';
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
