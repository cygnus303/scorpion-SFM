import { Injectable } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private apiHandlerService: ApiHandlerService) {}

  validateToken(data: { token: string }): Observable<any> {
    return this.apiHandlerService.Post('auth/validate-token', data);
  }
}
