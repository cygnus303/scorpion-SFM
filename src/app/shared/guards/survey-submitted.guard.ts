import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SurveySubmittedGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = route.queryParams['token'];

    // 1. Check if token exists
    if (!token) {
      this.router.navigate(['/survey-done'], { queryParams: { status: 'invalid' } });
      return false;
    }

    // Save parameters to sessionStorage if present in query params for page refresh persistence
    if (route.queryParams['triggerId']) {
      sessionStorage.setItem(`survey_triggerId_${token}`, route.queryParams['triggerId']);
    }
    if (route.queryParams['CustCode'] || route.queryParams['custCode']) {
      sessionStorage.setItem(`survey_custCode_${token}`, route.queryParams['CustCode'] || route.queryParams['custCode']);
    }
    if (route.queryParams['expiryDate']) {
      sessionStorage.setItem(`survey_expiryDate_${token}`, route.queryParams['expiryDate']);
    }

    // Retrieve from query params first, fallback to sessionStorage
    const triggerId = route.queryParams['triggerId'] || sessionStorage.getItem(`survey_triggerId_${token}`);
    const custCode = route.queryParams['CustCode'] || route.queryParams['custCode'] || sessionStorage.getItem(`survey_custCode_${token}`) || this.decodeSurveyToken(token);
    const expiryDateStr = route.queryParams['expiryDate'] || sessionStorage.getItem(`survey_expiryDate_${token}`);

    // 2. Decode and validate token format / customer code format
    const decryptedToken = this.decodeSurveyToken(token);
    const isTokenValid = decryptedToken && /^[A-Z0-9]{3,20}$/i.test(decryptedToken);
    const isCustCodeValid = custCode && /^[A-Z0-9]{3,20}$/i.test(custCode);

    // 3. Validate triggerId (must be numeric if present)
    const isTriggerValid = !triggerId || /^\d+$/.test(triggerId);

    // 3.5. URL Integrity Check using sessionStorage (detects manual URL parameter tampering on base URL)
    const cleanUrl = state.url.split('&')[0];
    const storageKey = `valid_survey_url_${token}`;
    const lastValidUrl = sessionStorage.getItem(storageKey);

    let isUrlIntact = true;
    if (!lastValidUrl) {
      // First time loading this token, record the URL
      sessionStorage.setItem(storageKey, cleanUrl);
    } else if (cleanUrl !== lastValidUrl) {
      // The user manually edited/tampered with the URL in the browser
      isUrlIntact = false;
    }

    if (!isTokenValid || !isCustCodeValid || !isTriggerValid || !isUrlIntact) {
      this.router.navigate(['/survey-done'], { queryParams: { status: 'invalid' } });
      return false;
    }

    // 3.8. Check if survey has expired
    if (expiryDateStr) {
      const parts = expiryDateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        
        const localExpiryDate = new Date(year, month, day, 23, 59, 59, 999);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!isNaN(localExpiryDate.getTime()) && today.getTime() > localExpiryDate.getTime()) {
          this.router.navigate(['/survey-done'], { queryParams: { status: 'expired' } });
          return false;
        }
      }
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