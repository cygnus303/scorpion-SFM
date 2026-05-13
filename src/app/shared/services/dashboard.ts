import { Inject, Injectable } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { Observable } from 'rxjs';
import { AddLeadRequest, LeadBySourceResponse, LeadByStatusResponse, LeadCategoryResponse, LeadDetailResponse, LeadResponse } from '../models/lead.model';
import { IApiBaseResponse } from '../interfaces/api-base-action-response';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    @Inject(ApiHandlerService) private apiHandlerService: ApiHandlerService
  ) { }

  GetLeadCount(filters: any): Observable<IApiBaseResponse<LeadByStatusResponse>> {
    return this.apiHandlerService.Get(`Dashboard/GetLeadCount?fromDate=${filters.fromDate}&toDate=${filters.toDate}`);
  }

  GetLeadQuotationCount(filters: any): Observable<IApiBaseResponse<LeadByStatusResponse>> {
    return this.apiHandlerService.Get(`Dashboard/GetLeadQuotationCount?fromDate=${filters.fromDate}&toDate=${filters.toDate}`);
  }

  GetPRQGenerateUpdateCount(filters: any): Observable<IApiBaseResponse<LeadByStatusResponse>> {
    return this.apiHandlerService.Get(`Dashboard/GetPRQGenerateUpdateCount?fromDate=${filters.fromDate}&toDate=${filters.toDate}`);
  }

  GetOpenComplaints(filters: any): Observable<IApiBaseResponse<LeadByStatusResponse>> {
    return this.apiHandlerService.Get(`Dashboard/GetOpenComplaints?fromDate=${filters.fromDate}&toDate=${filters.toDate}`);
  }
  
  GetDashboardSummary(filters: any): Observable<IApiBaseResponse<LeadByStatusResponse>> {
    return this.apiHandlerService.Get(`Dashboard/GetDashboardSummary?fromDate=${filters.fromDate}&toDate=${filters.toDate}`);
  }

  GetLeadPipeline(filters: any): Observable<IApiBaseResponse<LeadByStatusResponse>> {
    return this.apiHandlerService.Get(`Dashboard/GetLeadPipeline?fromDate=${filters.fromDate}&toDate=${filters.toDate}`);
  }

  GetProspectLeaderboard(filters: any): Observable<IApiBaseResponse<LeadByStatusResponse>> {
    return this.apiHandlerService.Get(`Dashboard/GetProspectLeaderboard?fromDate=${filters.fromDate}&toDate=${filters.toDate}`);
  }

  GetDashboardSalesOS(filters: any): Observable<IApiBaseResponse<LeadByStatusResponse>> {
    return this.apiHandlerService.Get(`Dashboard/GetDashboardSalesOS?startDate=${filters.startDate}&endDate=${filters.endDate}&userId=${filters.userId}`);
  }
}
