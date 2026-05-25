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

@Component({
  selector: 'app-csat-dashboard',
  imports: [CommonModule, RouterModule, NgSelectModule, ReactiveFormsModule],
  templateUrl: './csat-dashboard.html',
  styleUrl: './csat-dashboard.scss',
})
export class CsatDashboard {
  public customers: CustResponse[] = [];
  public surveyTriggerTypeData: GeneralMaster[] = [];
  public getDecisionEmail: any;
  public sendCSATSurveyForm!: FormGroup;
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
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.externalService.decisionEmail(data).subscribe({
      next: (response: any) => {
        if (response) {
          this.getDecisionEmail = response.data;
        }
      }
    });
  }

  buildForm(): void {
    this.sendCSATSurveyForm = new FormGroup({
      customerName: new FormControl(),
      customerCode: new FormControl(null, [Validators.required]),
      surveyTriggerType: new FormControl(null, [Validators.required]),
      emailsubject: new FormControl(),
      validity: new FormControl(null, [Validators.required]),
      personalisedMessage: new FormControl()
    });
  }

  sendSurvey() {
    if (!this.sendCSATSurveyForm.valid) {
      this.sendCSATSurveyForm.markAllAsTouched();
      return;
    }

    const payload = {
      id: 0,
      custCd: this.sendCSATSurveyForm.value.customerCode,
      custNm: this.getDecisionEmail?.custnm || '',
      email: this.getDecisionEmail?.decision_Email || '',
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
