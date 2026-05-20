import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-csat-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './csat-dashboard.html',
  styleUrl: './csat-dashboard.scss',
})
export class CsatDashboard {}
