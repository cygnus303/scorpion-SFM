import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SurveySubmittedGuard implements CanActivate {
 constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = route.queryParams['token'];

    if (!token) {
      this.router.navigate(['/survey-done'], { queryParams: { status: 'invalid' } });
      return false;
    }

    const usedTokens: string[] = JSON.parse(localStorage.getItem('usedSurveyTokens') || '[]');

    if (usedTokens.includes(token)) {
      this.router.navigate(['/survey-done'], { queryParams: { status: 'already-submitted' } });
      return false;
    }

    return true;
  }
}