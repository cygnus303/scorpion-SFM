import { Inject, Injectable } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { HttpClient } from '@angular/common/http';
import { IApiBaseResponse } from '../interfaces/api-base-action-response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Payment {
  constructor(@Inject(ApiHandlerService) private apiHandlerService: ApiHandlerService, private http: HttpClient) { }

  getPaymentList(): Observable<IApiBaseResponse<PaymentResponse[]>> {
    return this.apiHandlerService.Get('Expense/GetGeneratePaymentList');
  }

  uploadExcel(formData: any): Observable<IApiBaseResponse<any>> {
    return this.apiHandlerService.Post(`Expense/UploadUTRExcel`, formData);
  }

  downloadSample() {
    return this.apiHandlerService.DownloadFile(`Expense/DownloadRTGSTemplate`);
  }

  DownloadExcel(userId: string) {
    return this.apiHandlerService.DownloadFile(`Expense/download-excel?userId=${userId}`);
  }
}
