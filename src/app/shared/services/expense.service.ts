import { Inject, Injectable } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { Observable } from 'rxjs';
import { IApiBaseResponse } from '../interfaces/api-base-action-response';
import { ExpenseResponse, ExpenseDetailResponse, AddExpenseRequest, AddExpenseApprovalRequest, ApprovalRequest } from '../models/expense.model';
import { CommonResponse } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  constructor(
    @Inject(ApiHandlerService) private apiHandlerService: ApiHandlerService
  ) { }

  getExpenseList(
    filters: any
  ): Observable<IApiBaseResponse<ExpenseResponse[]>> {
    return this.apiHandlerService.Get('expense', filters);
  }

  getExpenseApprovalList(
    filters: any
  ): Observable<IApiBaseResponse<ExpenseResponse[]>> {
    return this.apiHandlerService.Get('Expense/ApprovalList', filters);
  }

  exportExpense(filters: any): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Get(`expense/ExportExpenseApproval`, filters);
  }

  getExpenseDetails(id: any, userId: any): Observable<IApiBaseResponse<ExpenseDetailResponse>> {
    return this.apiHandlerService.Get(`expense/${id}?userId=${userId}`);
  }

  addExpense(
    addExpenseRequest: AddExpenseRequest
  ): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Post('expense', addExpenseRequest);
  }

  addExpenseApproval(
    addExpenseApprovalRequest: AddExpenseApprovalRequest
  ): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Post(
      'expense/approval',
      addExpenseApprovalRequest
    );
  }

  updateExpense(
    id: string,
    addExpenseRequest: AddExpenseRequest
  ): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Post('expense/' + id, addExpenseRequest);
  }

  exportexport(userId: any, startDate: any, endDate: any, filters: any): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Get(`Expense/ExportExpense?userid=${userId}&startdate=${startDate}&enddate=${endDate}`, filters);
  }

  deleteExpense(id: string): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Patch('expense/' + id, null);
  }

  expenseApproval(approvalRequest: ApprovalRequest): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Post('Expense/approval', approvalRequest);
  }

  multipleExpenseApproval(approvalRequest: any): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Post('Expense/MultipleExpenseAproveList', approvalRequest);
  }

  downloadAuditorExpense(userId: string): Observable<IApiBaseResponse<any[]>> {
    return this.apiHandlerService.Get(`Expense/ExportExpenseApprovedButPaymentPendingData?userId=${userId}`);
  }

  expenseCard(params: any): Observable<any> {
    return this.apiHandlerService.Get(`Expense/DashboardCards?startDate=${params.startDate}&endDate=${params.endDate}&userID=${params.userId}`);
  }

  ApprovalDashboardCards(params: any): Observable<IApiBaseResponse<any>> {
    return this.apiHandlerService.Get(`Expense/ApprovalDashboardCards?startDate=${params.startDate}&endDate=${params.endDate}&userID=${params.userId}`);
  }

  claimExpense(formData: FormData): Observable<IApiBaseResponse<CommonResponse>> {
    return this.apiHandlerService.Post('Expense/AddTravelExpense', formData);
  }

  expenseApprovalList(params:any){
    return this.apiHandlerService.Get(`Expense/NewGetExpenseApprovalList?userId=${params.userId}&filterJson=${params.filterJson}&startdate=${params.startDate}&endDate=${params.endDate}`);

  }

}
