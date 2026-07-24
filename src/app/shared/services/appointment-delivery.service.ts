import { Inject, Injectable } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppointmentDeliveryService {
  constructor(
    @Inject(ApiHandlerService) private apiHandlerService: ApiHandlerService
  ) { }

  getDeliveryAppointmentData(payload: any): Observable<any> {
    return this.apiHandlerService.Post('AppointmentCSDMall/GetDeliveryAppointmentData', payload);
  }

  getDeliveryAppointmentDataExcel(payload: any): Observable<any> {
    return this.apiHandlerService.Post('AppointmentCSDMall/GetDeliveryAppointmentDataExcel', payload);
  }

  getDeliveryAppointmentDetail(payload: any): Observable<any> {
    return this.apiHandlerService.Post('AppointmentCSDMall/GetDeliveryAppointmentDetail', payload);
  }

  addEditAppointment(payload: any, baseUserName: string = ''): Observable<any> {
    return this.apiHandlerService.Post(`AppointmentCSDMall/AddEditAppointment?baseUserName=${baseUserName}`, payload);
  }

  checkDeliveryEligibility(docket: string, type: string): Observable<any> {
    return this.apiHandlerService.Get(`AppointmentCSDMall/CheckDeliveryEligibility?docket=${docket}&type=${type}`);
  }

  generateCsdMsdNo(payload: any): Observable<any> {
    return this.apiHandlerService.Post('AppointmentCSDMall/GenerateCsdMsdNo', payload);
  }
}
