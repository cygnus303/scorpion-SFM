import { Inject, Injectable } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IApiBaseResponse } from '../interfaces/api-base-action-response';
import { AddMeetingRequest, MeetingCountDayWise, MeetingDetailResponse, MeetingMoMResponse, MeetingResponse } from '../models/meeting.model';
import { CommonResponse } from '../models/common.model';
import { CustomersListResponse } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  public meetingResponseSubject = new Subject<any>();
  public resetLocationSearch = new Subject<boolean>();

  constructor(
    @Inject(ApiHandlerService) private apiHandlerService: ApiHandlerService, private http: HttpClient
  ) { }

  getMeetingList(
    filters: any
  ): Observable<IApiBaseResponse<MeetingResponse[]>> {
    return this.apiHandlerService.Get('meeting', filters);
  }
  exportMeeting(userId: any, filters: any, startDate: any, endDate: any): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Get(`Meeting/NewExport?userid=${userId}&startdate=${startDate}&enddate=${endDate}`, filters);
  }

  getMeetingDetails(id: string, UserId: string): Observable<IApiBaseResponse<MeetingDetailResponse>> {
    return this.apiHandlerService.Get(`meeting/${id}?UserId=${UserId}`);
  }

  addMeeting(
    addMeetingRequest: AddMeetingRequest
  ): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Post('meeting', addMeetingRequest);
  }

  addMeetingCheckInOut(
    addMeetingRequest: any
  ): Observable<IApiBaseResponse<any>> {
    return this.apiHandlerService.Post('Meeting/checkinout', addMeetingRequest);
  }

  updateMeeting(
    id: string,
    addMeetingRequest: AddMeetingRequest
  ): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Post('meeting/' + id, addMeetingRequest);
  }

  deleteMeeting(id: string): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Patch('meeting/' + id, null);
  }

  getMeetingMomDetails(): Observable<IApiBaseResponse<MeetingMoMResponse[]>> {
    return this.apiHandlerService.Get('Meeting/momlist');
  }

  getMeetingStatusData(filters: any): Observable<IApiBaseResponse<any>> {
    return this.apiHandlerService.Get('Dashboard/MeetingByStatus', filters);
  }

  getMeetingCountDayWise(filters: any): Observable<IApiBaseResponse<MeetingCountDayWise[]>> {
    return this.apiHandlerService.Get('Dashboard/MeetingCountDayWise', filters);
  }

  getGoogleDetail(payload: any) {
    return this.apiHandlerService.Get(`Meeting/GetDrivingDistance?originLat=${payload.originLat}&originLng=${payload.originLng}&destLat=${payload.destLat}&destLng=${payload.destLng}`);
  }


  getMeetingCustomer(userId: string, searchText: string): Observable<IApiBaseResponse<CustomersListResponse>> {
    return this.apiHandlerService.Get(`Meeting/PanIndiaCustomer?userid=${userId}&SearchText=${searchText}`);
  }

  getGeoLocationList(
    search: string
  ): Observable<any> {
    return this.apiHandlerService.Get(`Meeting/GetAddressFromSerach?input=${search}`);
  }

  getLatLongAccordingAddress(address: string): Observable<any> {
    return this.apiHandlerService.Get(`Meeting/GetCoordinates?address=${address}`);
  }

  getAssignedTo(): Observable<any> {
    return this.apiHandlerService.Get(`Meeting/AssignToList`);
  }

  getMOMList(userId: string, filter: any): Observable<any> {
    return this.apiHandlerService.Get(`Meeting/Pending-Mom?userId=${userId}`, filter);
  }

  onSubmitMOM(userId: string, payload: any): Observable<any> {
    return this.apiHandlerService.Post(`Meeting/SubmitMom?UserId=${userId}`, payload);
  }
}
