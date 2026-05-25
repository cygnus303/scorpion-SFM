import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-csat-customer-survey',
  imports: [CommonModule, RouterModule],
  templateUrl: './csat-customer-survey.html',
  styleUrl: './csat-customer-survey.scss',
})
export class CsatCustomerSurvey {
constructor(private router: Router, private route: ActivatedRoute) {}

  private answers: Record<string, number | null> = { q1: null, q2: null, q3: null, q4: null, nps: null };
  rate(q: string, val: number, btn: EventTarget) {
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

  ngOnInit() {
    this.buildNPS();
  }

    updateProgress() {
    const done = ['q1','q2','q3','q4'].filter(k => this.answers[k] !== null).length
      + (this.answers['nps'] !== null ? 1 : 0)
      + ((document.getElementById('sv2-comments') as HTMLTextAreaElement)?.value.trim() ? 1 : 0);
    const pct = Math.round((done / 6) * 100);
    const bar = document.getElementById('sv2-prog-bar');
    const txt = document.getElementById('sv2-prog-txt');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = done + ' of 6 answered';
  }

  private buildNPS() {
    const row = document.getElementById('sv2-nps');
    if (!row) return;
    for (let i = 0; i <= 10; i++) {
      const btn = document.createElement('button');
      btn.style.cssText = 'flex:1;height:34px;border-radius:5px;border:1px solid var(--border);background:var(--white);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;color:var(--text1)';
      btn.textContent = String(i);
      const col = i <= 6 ? '#CC0000' : i <= 8 ? '#D97706' : '#16A34A';
      btn.onclick = () => {
        row.querySelectorAll('button').forEach(b => {
          (b as HTMLElement).style.background = 'var(--white)';
          (b as HTMLElement).style.color = 'var(--text1)';
          (b as HTMLElement).style.borderColor = 'var(--border)';
        });
        btn.style.background = col;
        btn.style.color = '#fff';
        btn.style.borderColor = col;
        this.answers['nps'] = i;      // ← add karo
  this.updateProgress(); 
      };
      row.appendChild(btn);
    }
  }

  csatSubmit() {
   const token = this.route.snapshot.queryParams['token'];
  if (token) {
    const usedTokens: string[] = JSON.parse(localStorage.getItem('usedSurveyTokens') || '[]');
    usedTokens.push(token);
    localStorage.setItem('usedSurveyTokens', JSON.stringify(usedTokens));
  }

  this.router.navigate(['/survey-done'], { queryParams: { status: 'success' } });
}
}
