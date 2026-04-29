import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../shared/services/common.service';
import { HeaderService } from '../../../shared/services/header.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  public commonService = inject(CommonService);
  public headerService = inject(HeaderService);

  constructor() {}

  toggleSidebar() {
    this.commonService.toggleSidebar();
  }

  isSidebarCollapsed() {
    return this.commonService.isSidebarCollapsed();
  }

  updateHeader(title: string, subtitle: string = '') {
    this.headerService.updateHeader(title, subtitle);
  }

  updateHeaderFromMenu(menuKey: string) {
    this.headerService.updateHeaderFromMenu(menuKey);
  }
}
