import { Inject, Injectable } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { Observable } from 'rxjs';
import { IApiBaseResponse } from '../interfaces/api-base-action-response';
import { ExpenseResponse, ExpenseDetailResponse } from '../models/expense.model';
import { CommonResponse } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  constructor(
    @Inject(ApiHandlerService) private apiHandlerService: ApiHandlerService
  ) { }

  getExpenseList(filters: any): Observable<IApiBaseResponse<ExpenseResponse[]>> {
    return this.apiHandlerService.Get('expense', filters);
  }

  getExpenseDetails(id: string, userId: string): Observable<IApiBaseResponse<ExpenseDetailResponse>> {
    return this.apiHandlerService.Get(`expense/${id}?userId=${userId}`);
  }

  deleteExpense(id: string): Observable<IApiBaseResponse<any>> {
    return this.apiHandlerService.Post(`Expense/delete?id=${id}`, {});
  }

  exportexport(userId: string, fromDate: string, toDate: string, filters: any): Observable<IApiBaseResponse<any>> {
    return this.apiHandlerService.Get(`Expense/ExportExpense?userid=${userId}&startdate=${fromDate}&enddate=${toDate}`, filters);
  }

  updateExpense(
    id: string,
    addExpenseRequest: any
  ): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Post('expense/' + id, addExpenseRequest);
  }

}
