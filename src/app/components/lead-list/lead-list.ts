import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddLead } from '../add-lead/add-lead';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [CommonModule, AddLead,FormsModule],
  templateUrl: './lead-list.html',
  styleUrl: './lead-list.scss'
})
export class LeadList implements OnInit {
  @ViewChild('addLeadComponent') addLeadComponent!: AddLead;


  constructor() { }

  ngOnInit(): void {
  }

  openLeadModal() {
   this.addLeadComponent.showPopup();
  }

}
