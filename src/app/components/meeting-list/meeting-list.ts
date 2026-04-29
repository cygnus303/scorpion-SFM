import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meeting-list.html',
  styleUrl: './meeting-list.scss'
})
export class MeetingList implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
