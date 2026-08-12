import { Inject, Injectable } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Quotation {

  constructor(
    @Inject(ApiHandlerService) private apiHandlerService: ApiHandlerService, private http: HttpClient
  ) { }

  getGeneralMasterData(codeType: string) {
    return this.apiHandlerService.Get(`QuotationManage/GetGeneralMasterData?CodeType=${codeType}`);
  }

  getState() {
    return this.apiHandlerService.Get(`QuotationManage/GetStateMasterList`);
  }

  getCity() {
    return this.apiHandlerService.Get(`QuotationManage/GetCityMasterList`);
  }

  getCustomer(){
    return this.apiHandlerService.Get(`QuotationManage/GetProspectCustList`);
  }
}
