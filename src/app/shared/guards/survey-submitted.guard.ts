import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SurveySubmittedGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = route.queryParams['token'];
    const triggerId = route.queryParams['triggerId'];
    const custCode = route.queryParams['CustCode'] || this.decodeSurveyToken(token);

    // 1. Check if token exists
    if (!token) {
      this.router.navigate(['/survey-done'], { queryParams: { status: 'invalid' } });
      return false;
    }

    // 2. Decode and validate token format / customer code format
    const decryptedToken = this.decodeSurveyToken(token);
    const isTokenValid = decryptedToken && /^[A-Z0-9]{3,20}$/i.test(decryptedToken);
    const isCustCodeValid = custCode && /^[A-Z0-9]{3,20}$/i.test(custCode);

    // 3. Validate triggerId (must be numeric if present)
    const isTriggerValid = !triggerId || /^\d+$/.test(triggerId);

    // 3.5. URL Integrity Check using sessionStorage (detects manual URL parameter tampering)
    const storageKey = `valid_survey_url_${token}`;
    const lastValidUrl = sessionStorage.getItem(storageKey);
    const currentUrl = state.url;

    let isUrlIntact = true;
    if (!lastValidUrl) {
      // First time loading this token, record the URL
      sessionStorage.setItem(storageKey, currentUrl);
    } else if (currentUrl !== lastValidUrl) {
      // The user manually edited/tampered with the URL in the browser
      isUrlIntact = false;
    }

    if (!isTokenValid || !isCustCodeValid || !isTriggerValid || !isUrlIntact) {
      this.router.navigate(['/survey-done'], { queryParams: { status: 'invalid' } });
      return false;
    }

    // 4. Check if already submitted
    const usedTokens: string[] = JSON.parse(localStorage.getItem('usedSurveyTokens') || '[]');
    if (usedTokens.includes(token)) {
      this.router.navigate(['/survey-done'], { queryParams: { status: 'already-submitted' } });
      return false;
    }

    return true;
  }

  private decodeSurveyToken(base64Token: string): string {
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
}