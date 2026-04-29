import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderService } from '../../shared/services/header.service';

@Component({
  selector: 'app-call-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call-list.html',
  styleUrl: './call-list.scss'
})
export class CallList implements OnInit {
  private headerService = inject(HeaderService);

  constructor() { }

  ngOnInit(): void {
    this.headerService.updateHeader('Call');
  }

}
