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
}
