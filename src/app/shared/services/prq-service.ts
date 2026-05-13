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

  getEmailList(loc: string): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Get(`PRQ/GetEmailData?loc=${loc}`);
  }

  getCustomerList(partyName: string, paybas: string = ''): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Get(`PRQ/GetAllBillingParty?partyName=${partyName}&paybas=${paybas}`);
  }

  getCityPincodeDetails(searchTerm: string, loc: string = 'null'): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Get(`PRQ/GetCityPincodeDetails?loc=${loc}&searchTerm=${searchTerm}`);
  }

  getBranchCityFromPincode(pincode: string): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Get(`PRQ/GetBranchCityFromPincode?pincode=${pincode}`);
  }

  getCustomerDetails(custCode: string): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Get(`PRQ/GetCustomerDetails?custCode=${custCode}`);
  }

  postSubmitPRQ(payload: any): Observable<IApiBaseResponse<any>> {
    return this.apiHandlerService.Post('PRQ/SubmitPRQ', payload);
  }
}
