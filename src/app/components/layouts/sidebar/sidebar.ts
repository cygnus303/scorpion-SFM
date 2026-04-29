import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonService } from '../../../shared/services/common.service';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HeaderService } from '../../../shared/services/header.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  public commonService = inject(CommonService);
  public headerService = inject(HeaderService);

  toggleSidebar() {
    this.commonService.toggleSidebar();
  }

  onMenuClick(menuKey: string) {
    this.headerService.updateHeaderFromMenu(menuKey);
  }
}
