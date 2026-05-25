import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from '../../../shared/services/common.service';
import { CustResponse } from '../../../shared/models/customer.model';
import { ExternalService } from '../../../shared/services/external.service';

@Component({
  selector: 'app-csat-dashboard',
  imports: [CommonModule, RouterModule,NgSelectModule],
  templateUrl: './csat-dashboard.html',
  styleUrl: './csat-dashboard.scss',
})
export class CsatDashboard {
  public customers: CustResponse[] = [];
  private destroy$ = new Subject<void>();

  constructor(public commonService: CommonService,public externalService:ExternalService) { }
  
  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getCustomers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCustomers() {
    this.externalService.getCustomers().subscribe({
      next: (response:any) => {
        if (response) this.customers = response.data;
      }
    });
  }
}
