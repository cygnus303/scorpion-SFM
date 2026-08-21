import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from '../../../shared/services/common.service';
import { CustResponse } from '../../../shared/models/customer.model';
import { ExternalService } from '../../../shared/services/external.service';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';
import { GeneralMaster } from '../../../shared/models/expenseGeneral.model';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IdentityService } from '../../../shared/services/identity.service';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';

@Component({
  selector: 'app-csat-dashboard',
  imports: [CommonModule, RouterModule, NgSelectModule, ReactiveFormsModule, CountUpDirective],
  templateUrl: './csat-dashboard.html',
  styleUrl: './csat-dashboard.scss',
})
export class CsatDashboard {
  public isLoading: boolean = false;
  public isCardsLoading: boolean = true;
  public customers: CustResponse[] = [];
  public surveyTriggerTypeData: GeneralMaster[] = [];
  public getDecisionEmail: any;
  public sendCSATSurveyForm!: FormGroup;
  public dashboardData: any;
  private destroy$ = new Subject<void>();
  private expenseGeneralService = inject(ExpenseGeneralService);
  private identityService = inject(IdentityService);
  private sweetAlertService = inject(SweetAlertService);
  public validityData = [{ codeDesc: '7 days', codeId: 7 }, { codeDesc: '14 days', codeId: 14 }, { codeDesc: '30 days', codeId: 30 }];
  constructor(public commonService: CommonService, public externalService: ExternalService) { }

  ngOnInit(): void {
    this.buildForm();
    this.commonService.filterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getCustomers();
      this.getProductType();
      this.getCSATDashboard();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCSATDashboard() {
    this.isLoading = true;
    const userId = this.identityService.getLoggedUserId();
    this.externalService.getCSATDashboard(userId).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isCardsLoading = false;
        if (response && response.success) {
          this.dashboardData = response.data;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isCardsLoading = false;
        console.error('Error fetching CSAT dashboard:', err);
      }
    });
  }

  getScoreCount(score: number): number {
    if (!this.dashboardData?.scoreDistribution) return 0;
    const item = this.dashboardData.scoreDistribution.find((x: any) => Number(x.ans) === score);
    return item ? Number(item.totalAns) : 0;
  }

  getScorePercent(score: number): number {
    const count = this.getScoreCount(score);
    if (count === 0) return 0;
    let total = 0;
    this.dashboardData.scoreDistribution.forEach((x: any) => {
      total += Number(x.totalAns);
    });
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  getDistributionTotal(): number {
    if (!this.dashboardData?.scoreDistribution) return 0;
    let total = 0;
    this.dashboardData.scoreDistribution.forEach((x: any) => {
      total += Number(x.totalAns);
    });
    return total;
  }

  getPromoterPercent(): number {
    const total = this.getDistributionTotal();
    if (total === 0) return 0;
    const count = this.getScoreCount(5);
    return Math.round((count / total) * 100);
  }

  getDetractorPercent(): number {
    const total = this.getDistributionTotal();
    if (total === 0) return 0;
    const count = this.getScoreCount(1) + this.getScoreCount(2);
    return Math.round((count / total) * 100);
  }

  getPassivePercent(): number {
    const total = this.getDistributionTotal();
    if (total === 0) return 0;
    const count = this.getScoreCount(3) + this.getScoreCount(4);
    return Math.round((count / total) * 100);
  }

  getStars(score: string | number): string {
    const count = Math.round(Number(score || 0));
    return '⭐'.repeat(Math.max(0, Math.min(5, count)));
  }

  getFeedStyle(ans: string | number): { [key: string]: string } {
    const score = Number(ans);
    if (score >= 4) {
      return { 'background': '#F0FDF4', 'border': '1px solid #BBF7D0', 'border-radius': '8px', 'padding': '10px 12px' };
    } else if (score === 3) {
      return { 'background': '#FFFBEB', 'border': '1px solid #FCD34D', 'border-radius': '8px', 'padding': '10px 12px' };
    } else {
      return { 'background': '#FFF0F0', 'border': '1px solid #FFD5D5', 'border-radius': '8px', 'padding': '10px 12px' };
    }
  }

  getFeedCommentColor(ans: string | number): string {
    const score = Number(ans);
    if (score >= 4) return '#166534';
    if (score === 3) return '#92400E';
    return '#7F1D1D';
  }

  getStatusClass(status: string): string {
    if (!status) return 'pgy';
    status = status.toLowerCase();
    if (status.includes('health') || status.includes('good') || status.includes('satisfy')) return 'pg';
    if (status.includes('risk') || status.includes('warning') || status.includes('medium')) return 'pa';
    if (status.includes('critical') || status.includes('poor') || status.includes('bad')) return 'pr';
    return 'pgy';
  }

  getDotClass(status: string): string {
    if (!status) return '';
    status = status.toLowerCase();
    if (status.includes('health') || status.includes('good') || status.includes('satisfy')) return 'hg';
    if (status.includes('risk') || status.includes('warning') || status.includes('medium')) return 'ha';
    if (status.includes('critical') || status.includes('poor') || status.includes('bad')) return 'hr';
    return '';
  }

  getScoreColor(score: string | number | null | undefined): string {
    if (score === null || score === undefined || score === '' || isNaN(Number(score))) return 'var(--text3)';
    const num = Number(score);
    if (num >= 4.0) return 'var(--green)';
    if (num >= 3.0) return 'var(--amber)';
    return 'var(--red)';
  }

  getShortCategory(category: string): string {
    if (!category) return '';
    if (category.toLowerCase().includes('delivery')) return 'On-time Delivery';
    if (category.toLowerCase().includes('pickup')) return 'Pickup Service';
    if (category.toLowerCase().includes('responsiveness') || category.toLowerCase().includes('respons')) return 'CS Responsiveness';
    if (category.toLowerCase().includes('overall')) return 'Overall Experience';
    let clean = category.replace(/How Satisfied Are You With Our /gi, '')
                        .replace(/How Would You Rate Your /gi, '')
                        .replace(/\?/gi, '')
                        .trim();
    if (clean.length > 25) {
      clean = clean.substring(0, 22) + '...';
    }
    return clean;
  }

  getLowestCategory(): string {
    if (!this.dashboardData?.categorywiseCSAT || this.dashboardData.categorywiseCSAT.length === 0) {
      return 'No category data available';
    }
    let lowest = this.dashboardData.categorywiseCSAT[0];
    for (const item of this.dashboardData.categorywiseCSAT) {
      if (item.avgScore < lowest.avgScore) {
        lowest = item;
      }
    }
    const categoryName = this.getShortCategory(lowest.category);
    return `${categoryName} (${lowest.avgScore.toFixed(1)}) — lowest rated.`;
  }

  getCSATColor(score: string | number | null | undefined): string {
    if (score === null || score === undefined || score === '' || isNaN(Number(score))) return 'var(--border)';
    const s = Number(score);
    if (s >= 4.0) return 'var(--green)';
    if (s >= 3.0) return 'var(--amber)';
    return 'var(--red)';
  }

  selectCustomerForSurvey(custCd: string) {
    if (custCd) {
      this.sendCSATSurveyForm.patchValue({ customerCode: custCd });
      this.onCustomerChange(custCd);
    }
  }

  getCustomers() {
    this.externalService.getCustomers().subscribe({
      next: (response: any) => {
        if (response) this.customers = response.data;
      }
    });
  }

  getProductType(searchText: string | null = null) {
    this.expenseGeneralService.getGeneralMaster(searchText, 'SurveyTrigger').subscribe({
      next: (response: any) => {
        if (response) {
          this.surveyTriggerTypeData = response.data;
        }
      }
    });
  }

  onCustomerChange(data: any): void {
    if (!data) {
      this.getDecisionEmail = null;
      this.sendCSATSurveyForm.patchValue({ email: '' });
      return;
    }
    this.externalService.decisionEmail(data).subscribe({
      next: (response: any) => {
        if (response) {
          this.getDecisionEmail = response.data;
          this.sendCSATSurveyForm.patchValue({
            email: this.getDecisionEmail?.decision_Email || ''
          });
        }
      }
    });
  }

  getSelectedCustomerName(): string {
    const custCd = this.sendCSATSurveyForm.get('customerCode')?.value;
    if (!custCd) return '';
    const cust = this.customers.find(c => c.custcd === custCd);
    return cust ? cust.custnm : (this.getDecisionEmail?.custnm || '');
  }

  buildForm(): void {
    this.sendCSATSurveyForm = new FormGroup({
      customerName: new FormControl(),
      customerCode: new FormControl(null, [Validators.required]),
      surveyTriggerType: new FormControl(null, [Validators.required]),
      emailsubject: new FormControl(),
      validity: new FormControl(null, [Validators.required]),
      personalisedMessage: new FormControl(),
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  sendSurvey() {
    if (!this.sendCSATSurveyForm.valid) {
      this.sendCSATSurveyForm.markAllAsTouched();
      return;
    }

    const email = this.sendCSATSurveyForm.value.email || '';
    if (!email) {
      this.sweetAlertService.error('Recipient email is missing. Survey cannot be sent.');
      return;
    }

    const selectedCustCode = this.sendCSATSurveyForm.value.customerCode;
    const customer = this.customers.find(c => c.custcd === selectedCustCode);
    const custNm = customer?.custnm || this.getDecisionEmail?.custnm || '';

    const payload = {
      id: 0,
      custCd: selectedCustCode,
      custNm: custNm,
      email: email,
      triggerId: this.sendCSATSurveyForm.value.surveyTriggerType || '',
      validFor: Number(this.sendCSATSurveyForm.value.validity || 0),
      subjectLine: this.sendCSATSurveyForm.value.emailsubject || '',
      openingMessage: this.sendCSATSurveyForm.value.personalisedMessage || '',
      entryBy: this.identityService.getLoggedUserId()
    };
    this.externalService.sendCSATSurvey(payload).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.sweetAlertService.success(response.data?.message || 'Survey email sent successfully!');
          this.resetForm();
          this.getCSATDashboard();
        } else {
          this.sweetAlertService.error(response?.error?.message || 'Failed to send survey.');
        }
      },
      error: (err: any) => {
        this.sweetAlertService.error(err?.error?.message || 'Error occurred while sending survey.');
      }
    });
  }

  resetForm() {
    this.sendCSATSurveyForm.reset();
    this.getDecisionEmail = null;
    this.buildForm();
  }
}
