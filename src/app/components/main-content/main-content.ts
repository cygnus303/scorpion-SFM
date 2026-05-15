import { Component, inject } from '@angular/core';
import { CommonService } from '../../shared/services/common.service';
import { DashboardService } from '../../shared/services/dashboard';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-content',
  imports: [CommonModule],
  templateUrl: './main-content.html',
  styleUrl: './main-content.scss',
})
export class MainContent {
  public commonService = inject(CommonService);
  public dashboardService = inject(DashboardService);
  public leadPipeline: any;
  public prospectLeaderboard: any;
  public totalCount: any = {};
    public router = inject(Router);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.GetLeadPipeline();
      this.GetDashboardSalesOS();
      this.GetProspectLeaderboard();
      this.GetDashboardSummary();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(+year, +month - 1, +day);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(',', '').toLowerCase();
  };


  GetDashboardSummary() {
    const params = {
      fromDate: this.formatDate(this.commonService.globalFilters.startDate),
      toDate: this.formatDate(this.commonService.globalFilters.endDate),
    }

    this.dashboardService.GetDashboardSummary(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.totalCount = response.data
        }
      }
    });
  }

  pipelineColors: string[] = [
    '#CC0000',
    '#990000',
    '#660000',
    '#3D0000',
    '#16A34A',
    '#EA580C',
    '#2563EB',
    '#7C3AED',
    '#0891B2'
  ];

  GetLeadPipeline() {
    const params = {
      fromDate: this.formatDate(this.commonService.globalFilters.startDate),
      toDate: this.formatDate(this.commonService.globalFilters.endDate),
    }

    this.dashboardService.GetLeadPipeline(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.leadPipeline = response.data;
        }
      }
    });
  }


  GetDashboardSalesOS() {
    const params = {
      startDate: this.formatDate(this.commonService.globalFilters.startDate),
      endDate: this.formatDate(this.commonService.globalFilters.endDate),
      userId: this.commonService.globalFilters.UserID.toString(),
    }

    this.dashboardService.GetDashboardSalesOS(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.totalCount.totalSales = response.data.totalSales;
          this.totalCount.totalOS = response.data.totalOS;
        }
      }
    });
  }

formatAmount(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return '0';
  }
  if (value >= 10000000) {
    return (value / 10000000).toFixed(2) + 'Cr';
  } else if (value >= 100000) {
    return (value / 100000).toFixed(2) + 'L';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  } else {
    return value.toFixed(2);
  }
}

  GetProspectLeaderboard() {
    const params = {
      fromDate: this.formatDate(this.commonService.globalFilters.startDate),
      toDate: this.formatDate(this.commonService.globalFilters.endDate),
    }

    this.dashboardService.GetProspectLeaderboard(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.prospectLeaderboard = response.data;
        }
      }
    });
  }
}
