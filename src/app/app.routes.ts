import { Routes } from '@angular/router';
import { Login } from './components/layouts/login/login';
import { MainContent } from './components/main-content/main-content';
import { CustomerList } from './components/customer-list/customer-list';
import { LeadList } from './components/lead-list/lead-list';
import { MeetingList } from './components/meeting-list/meeting-list';
import { CallList } from './components/call-list/call-list';
import { ExpenseList } from './components/expense-list/expense-list';
import { ExpenseGeneralMaster } from './components/expense-general-master/expense-general-master';
import { ExpenseApproval } from './components/expense-approval/expense-approval';
import { QuotationQMS } from './components/quotation-qms/quotation-qms';
import { PickupRequestList } from './components/pickup-request-list/pickup-request-list';
import { SalesDashboard } from './components/sales-dashboard/sales-dashboard';
import { CollectionDashboard } from './components/collection-dashboard/collection-dashboard';
import { CSLevelDashboard } from './components/cslevel-dashboard/cslevel-dashboard';
import { ComplaintList } from './components/complaint-list/complaint-list';
import { TaskList } from './components/task-list/task-list';
import { MyCalendar } from './components/my-calendar/my-calendar';
import { TrainingHub } from './components/training-hub/training-hub';
import { authGuard } from './shared/guards/auth.guard';
import { PaymentList } from './components/payment-list/payment-list';
import { MeetingMomList } from './components/meeting-mom-list/meeting-mom-list';
import { CsatLayout } from './components/csat-layout/csat-layout';
import { CsatDashboard } from './components/csat-layout/csat-dashboard/csat-dashboard';
import { CsatSendSurvey } from './components/csat-layout/csat-send-survey/csat-send-survey';
import { CsatCustomerSurvey } from './components/csat-layout/csat-customer-survey/csat-customer-survey';
import { CsatSurveyLog } from './components/csat-layout/csat-survey-log/csat-survey-log';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: MainContent, canActivate: [authGuard] },
  { path: 'customer', component: CustomerList, canActivate: [authGuard] },
  { path: 'lead', component: LeadList, canActivate: [authGuard] },
  { path: 'meeting', component: MeetingList, canActivate: [authGuard] },
  { path: 'call', component: CallList, canActivate: [authGuard] },
  { path: 'expense', component: ExpenseList, canActivate: [authGuard] },
  { path: 'general-master', component: ExpenseGeneralMaster, canActivate: [authGuard] },
  { path: 'expense-approval', component: ExpenseApproval, canActivate: [authGuard] },
  { path: 'quotation', component: QuotationQMS, canActivate: [authGuard] },
  { path: 'pickup-request', component: PickupRequestList, canActivate: [authGuard] },
  { path: 'sales-dashboard', component: SalesDashboard, canActivate: [authGuard] },
  { path: 'collection-dashboard', component: CollectionDashboard, canActivate: [authGuard] },
  { path: 'cs-dashboard', component: CSLevelDashboard, canActivate: [authGuard] },
  { path: 'complaint', component: ComplaintList, canActivate: [authGuard] },
  {
    path: 'csat',
    component: CsatLayout,
    canActivate: [authGuard],
    children: [
      { path: '', component: CsatDashboard },
      { path: 'send-survey', component: CsatSendSurvey },
      { path: 'customer-survey', component: CsatCustomerSurvey },
      { path: 'survey-log', component: CsatSurveyLog }
    ]
  },
  { path: 'task', component: TaskList, canActivate: [authGuard] },
  { path: 'calendar', component: MyCalendar, canActivate: [authGuard] },
  { path: 'training', component: TrainingHub, canActivate: [authGuard] },
  { path: 'payment', component: PaymentList, canActivate: [authGuard] },
  { path: 'meeting-MOM', component: MeetingMomList, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
