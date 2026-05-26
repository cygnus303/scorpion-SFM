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
  public nextMonthSales: any;
  public totalCount: any = {};
  public salesCollectionCount: any = {}
  public router = inject(Router);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.GetLeadPipeline();
      this.GetDashboardSalesOS();
      this.GetProspectLeaderboard();
      this.GetDashboardSummary();
      this.GetnextMonthSales();
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
      userId: this.commonService.globalFilters.UserID.toString(),
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
          this.salesCollectionCount = response.data;
        }
      }
    });
  }

  GetnextMonthSales() {
    const rawStart = this.commonService.globalFilters.startDate;
    const rawEnd = this.commonService.globalFilters.endDate;

    if (!rawStart || !rawEnd) {
      console.warn('Start or End date is missing');
      return;
    }

    const parseDate = (dateStr: string): Date => {
      const [day, month, year] = dateStr.split('/');
      return new Date(+year, +month - 1, +day);
    };

    const currentStartDate = parseDate(rawStart);
    const currentEndDate = parseDate(rawEnd);

    if (isNaN(currentStartDate.getTime()) || isNaN(currentEndDate.getTime())) {
      console.warn('Invalid date value:', rawStart, rawEnd);
      return;
    }

    // Calculate number of months selected
    const monthSpan = (currentEndDate.getFullYear() - currentStartDate.getFullYear()) * 12
                    + (currentEndDate.getMonth() - currentStartDate.getMonth()) + 1;

    // Subtract the month span from both dates to get the previous period
    let prevStartDate = new Date(currentStartDate);
    prevStartDate.setMonth(prevStartDate.getMonth() - monthSpan);

    let prevEndDate = new Date(currentEndDate);
    prevEndDate.setMonth(prevEndDate.getMonth() - monthSpan);

    const toSlashFormat = (date: Date): string => {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const params = {
      startDate: this.formatDate(toSlashFormat(prevStartDate)),
      endDate: this.formatDate(toSlashFormat(prevEndDate)),
      userId: this.commonService.globalFilters.UserID.toString(),
    };

    console.log('Previous period params:', params);

    this.dashboardService.GetDashboardSalesOS(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.nextMonthSales = response.data;
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
