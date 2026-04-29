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
  public headerService = inject(HeaderService);
  public headerTitle$ = this.headerService.headerTitle$;
  public commonService = inject(CommonService);


  constructor() {}

  toggleSidebar() {
    this.commonService.toggleSidebar();
  }

  isSidebarCollapsed() {
    return this.commonService.isSidebarCollapsed();
  }
}
