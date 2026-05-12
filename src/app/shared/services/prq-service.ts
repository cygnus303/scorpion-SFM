import { Inject, Injectable } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { Observable } from 'rxjs';
import { IApiBaseResponse } from '../interfaces/api-base-action-response';

@Injectable({
  providedIn: 'root',
})
export class PrqService {
  constructor(
    @Inject(ApiHandlerService) private apiHandlerService: ApiHandlerService
  ) { }

  getPRQCard(payload: any): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Post('PRQ/GetPRQStatusWiseList', payload);
  }

  getPRQList(payload: any): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Post('PRQ/GetPRQGenerationList', payload);
  }

  DownloadPRQ(params: any): Observable<Blob> {
    return this.apiHandlerService.GetBlob('PRQ/DownloadPRQ', params);
  }
}
