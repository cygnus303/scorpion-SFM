import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lead-list.html',
  styleUrl: './lead-list.scss'
})
export class LeadList implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
