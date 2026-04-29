import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../shared/services/common.service';
import { HeaderService } from '../../../shared/services/header.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  public headerService = inject(HeaderService);
  public headerTitle$ = this.headerService.headerTitle$;
  public commonService = inject(CommonService);
  private router = inject(Router);

  constructor() {
    // Listen to route changes to update header title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.updateHeaderFromUrl(url);
    });

    // Set initial header title based on current route
    this.updateHeaderFromUrl(this.router.url);
  }

  toggleSidebar() {
    this.commonService.toggleSidebar();
  }

  isSidebarCollapsed() {
    return this.commonService.isSidebarCollapsed();
  }

  private updateHeaderFromUrl(url: string) {
    // Remove leading slash and query params
    const cleanUrl = url.replace(/^\//, '').split('?')[0];
    
    // Map routes to menu keys
    const routeToMenuKey: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'customer': 'customer',
      'lead': 'Lead',
      'meeting': 'Meeting',
      'call': 'call',
      'quotation': 'quotation',
      'pickup-request': 'pickup-request',
      'expense': 'expense',
      'general-master': 'expense-master',
      'expense-approval': 'expense-approval',
      'sales-dashboard': 'sales-dashboard',
      'collection-dashboard': 'collection-dashboard',
      'cs-dashboard': 'cs-dashboard',
      'complaint': 'complaint',
      'task': 'task',
      'calendar': 'calendar',
      'training': 'training',
      'login': 'Dashboard'
    };
    
    const menuKey = routeToMenuKey[cleanUrl] || 'Dashboard';
    this.headerService.updateHeaderFromMenu(menuKey);
  }
}
