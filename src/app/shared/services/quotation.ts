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

  getView(custCode:string){
    return this.apiHandlerService.Get(`QuotationManage/QuotationViewPrint?custCode=${custCode}`);
  }

  getPincode(){
    return this.apiHandlerService.Get(`QuotationManage/GetPinCodeMasterList`);
  }

  submitKYC(data: any){
    return this.apiHandlerService.Post(`QuotationManage/SubmitKYCDetails`, data);
  }

  sendApproval(data: any){
    return this.apiHandlerService.Post(`QuotationManage/SendForApproval`, data);
  }

  getKYCDetail(custCode:string){
    return this.apiHandlerService.Get(`QuotationManage/GetKYCCustomerDetails?custCode=${custCode}`);
  }

  getGSTDetail(gstNo:string){
    return this.apiHandlerService.Get(`QuotationManage/GetGSTDetails?gstNo=${gstNo}`);
  }
}
