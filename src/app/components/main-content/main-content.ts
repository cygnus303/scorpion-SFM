import { Component, inject } from '@angular/core';
import { CommonService } from '../../shared/services/common.service';
import { DashboardService } from '../../shared/services/dashboard';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

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
  totalCount = {
    totalLeadCount: 0,
    totalQuotationCount: 0,
    prQ_SuccessRate: 0,
    prQ_Module: 0,
    open_Complaints: 0,
    totalOS: 0,
    totalSales: 0,
  }

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getLeadCards();
      this.GetLeadQuotationCount();
      this.GetPRQGenerateUpdateCount();
      this.GetOpenComplaints();
      this.GetLeadPipeline();
      this.GetDashboardSalesOS();
      this.GetProspectLeaderboard();
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

  getLeadCards() {
    const params = {
      fromDate: this.formatDate(this.commonService.globalFilters.startDate),
      toDate: this.formatDate(this.commonService.globalFilters.endDate),
    }

    this.dashboardService.GetLeadCount(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalCount.totalLeadCount = response.data.totalLeadCount;
        }
      }
    });
  }

  GetLeadQuotationCount() {
    const params = {
      fromDate: this.formatDate(this.commonService.globalFilters.startDate),
      toDate: this.formatDate(this.commonService.globalFilters.endDate),
    }

    this.dashboardService.GetLeadQuotationCount(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalCount.totalQuotationCount = response.data.totalLeadCount;
        }
      }
    });
  }

  GetPRQGenerateUpdateCount() {
    const params = {
      fromDate: this.formatDate(this.commonService.globalFilters.startDate),
      toDate: this.formatDate(this.commonService.globalFilters.endDate),
    }

    this.dashboardService.GetPRQGenerateUpdateCount(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.totalCount.prQ_Module = response.data.prQ_Module;
          this.totalCount.prQ_SuccessRate = response.data.prQ_SuccessRate;
        }
      }
    });
  }

  GetOpenComplaints() {
    const params = {
      fromDate: this.formatDate(this.commonService.globalFilters.startDate),
      toDate: this.formatDate(this.commonService.globalFilters.endDate),
    }

    this.dashboardService.GetOpenComplaints(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.totalCount.open_Complaints = response.data.open_Complaints;
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
