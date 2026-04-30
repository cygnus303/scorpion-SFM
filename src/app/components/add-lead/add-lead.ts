import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-lead',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-lead.html',
  styleUrl: './add-lead.scss'
})
export class AddLead {
public isModalShow:boolean=false;


  constructor() { }

showPopup() {
  console.log('Showing popup');
  this.isModalShow=true;
}

closeModal() {
  this.isModalShow=false;
}

}
