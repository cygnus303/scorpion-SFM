import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExternalService } from '../../../shared/services/external.service';
import { ExpenseGeneralService } from '../../../shared/services/expense-general.service';

@Component({
  selector: 'app-csat-customer-survey',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './csat-customer-survey.html',
  styleUrl: './csat-customer-survey.scss',
})
export class CsatCustomerSurvey implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private externalService: ExternalService,
    private expenseGeneralService: ExpenseGeneralService
  ) { }

  public answers: Record<string, number | null> = {};
  public surveyQuestions: any[] = [];
  public decryptedToken: string = '';
  public isBlocked: boolean = false;
  public anySuggestions: string = '';

  
  ngOnInit() {
    const rawToken = this.route.snapshot.queryParams['token'];
    const triggerId = this.route.snapshot.queryParams['triggerId'];
    const custCodeQuery = this.route.snapshot.queryParams['CustCode'];
    if (rawToken) {
      this.decryptedToken = custCodeQuery || this.decodeSurveyToken(rawToken);
      console.log('Decrypted CSAT Token / CustCode:', this.decryptedToken);

      const isTriggerValid = !triggerId || /^\d+$/.test(triggerId);
      if (triggerId && isTriggerValid) {
        this.getSurvey(triggerId, this.decryptedToken);
      }
      // URL Integrity Check using sessionStorage (detects manual URL parameter tampering)
      const storageKey = `valid_survey_url_${rawToken}`;
      const lastValidUrl = sessionStorage.getItem(storageKey);
      const currentUrl = this.router.url;
      let isUrlIntact = true;
      if (!lastValidUrl) {
        // First time loading this token, record the URL
        sessionStorage.setItem(storageKey, currentUrl);
      } else if (currentUrl !== lastValidUrl) {
        // The user manually edited/tampered with the URL in the browser
        isUrlIntact = false;
      }

      const isTokenValid = /^[A-Z0-9]{3,20}$/i.test(this.decodeSurveyToken(rawToken));
      const isCustCodeValid = this.decryptedToken && /^[A-Z0-9]{3,20}$/i.test(this.decryptedToken);

      if (!isTokenValid || !isCustCodeValid || !isTriggerValid || !isUrlIntact) {
        this.isBlocked = true;
        this.router.navigate(['/survey-done'], { queryParams: { status: 'invalid' } });
      }
    } else {
      this.isBlocked = true;
      this.router.navigate(['/survey-done'], { queryParams: { status: 'invalid' } });
    }
  }

  getSurvey(triggerId: string, custCode: string) {
    if (!triggerId || !custCode) return;

    // 1. Fetch survey trigger name to display in the header
    this.expenseGeneralService.getGeneralMaster(null, 'SurveyTrigger').subscribe({
      next: (response: any) => {
        if (response && response.data) {
          const matched = response.data.find((item: any) => String(item.codeId) === triggerId);
          if (matched) {
            console.log('Matched Survey Trigger:', matched.codeDesc);
            const element = document.getElementById('sv2-account');
            if (element) {
              element.textContent = matched.codeDesc;
            }
          }
        }
      }
    });

    // 2. Fetch survey questions dynamically
    this.externalService.getCustomerSurveyQuestions(triggerId, custCode).subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          this.surveyQuestions = response.data;

          // Re-initialize answers object dynamically based on dynamic questions' codeId
          this.answers = {};
          this.surveyQuestions.forEach((q: any) => {
            this.answers[q.codeId] = null;
          });

          this.updateProgress();
        }
      },
      error: (err: any) => {
        console.error('Error fetching survey questions:', err);
      }
    });
  }

  csatSubmit() {
    if (this.isBlocked) return;

    // Validate that all dynamic questions have been answered
    const unanswered = this.surveyQuestions.some(q => this.answers[q.codeId] === null);
    if (unanswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    const payload = {
      custId: this.surveyQuestions[0]?.custId || this.decryptedToken,
      anySuggestions: this.anySuggestions,
      answers: this.surveyQuestions.map(q => ({
        questionCodeId: q.codeId,
        ans: this.answers[q.codeId]?.toString(),
        totalAns: "5"
      }))
    };

    console.log('Submitting CSAT Survey response:', payload);

    this.externalService.submitCSATResponse(payload).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          const token = this.route.snapshot.queryParams['token'];
          if (token) {
            const usedTokens: string[] = JSON.parse(localStorage.getItem('usedSurveyTokens') || '[]');
            usedTokens.push(token);
            localStorage.setItem('usedSurveyTokens', JSON.stringify(usedTokens));
          }
          this.router.navigate(['/survey-done'], { queryParams: { status: 'success' } });
        } else {
          alert(response?.error?.message || 'Failed to submit survey.');
        }
      },
      error: (err: any) => {
        console.error('Error submitting survey response:', err);
        alert('An error occurred while submitting your feedback. Please try again.');
      }
    });
  }

  decodeSurveyToken(base64Token: string): string {
    try {
      if (!base64Token) return '';
      let paddedToken = base64Token.trim();
      while (paddedToken.length % 4 !== 0) {
        paddedToken += '=';
      }
      const binaryString = atob(paddedToken);
      let decoded = '';
      for (let i = 0; i < binaryString.length; i += 2) {
        const charCode = binaryString.charCodeAt(i) + (binaryString.charCodeAt(i + 1) << 8);
        decoded += String.fromCharCode(charCode);
      }
      return decoded.replace(/\0/g, '');
    } catch (error) {
      return '';
    }
  }


  rate(q: string, val: number, btn: EventTarget) {
    if (this.isBlocked) return;
    const el = btn as HTMLElement;
    const colors: Record<number, string> = { 1: '#CC0000', 2: '#ea580c', 3: '#D97706', 4: '#65a30d', 5: '#16A34A' };
    el.parentElement?.querySelectorAll('button').forEach(b => {
      (b as HTMLElement).style.borderColor = 'var(--border)';
      (b as HTMLElement).style.background = 'var(--white)';
    });
    el.style.borderColor = colors[val];
    el.style.background = val >= 4 ? 'var(--green-lt)' : val === 3 ? 'var(--amber-lt)' : 'var(--red-lt)';
    this.answers[q] = val;
    this.updateProgress();
  }

  updateProgress() {
    if (this.isBlocked) return;

    // Count how many dynamic questions have been rated
    const dynamicDone = this.surveyQuestions.filter(q => this.answers[q.codeId] !== null).length;
    const totalCount = this.surveyQuestions.length;
    const done = dynamicDone;

    const pct = totalCount > 0 ? Math.round((done / totalCount) * 100) : 0;
    const bar = document.getElementById('sv2-prog-bar');
    const txt = document.getElementById('sv2-prog-txt');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = `${done} of ${totalCount} answered`;
  }
}
