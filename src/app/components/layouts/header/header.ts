import { Component, inject } from '@angular/core';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  public commonService = inject(CommonService);

  toggleSidebar() {
    this.commonService.toggleSidebar();
  }
}
