import { Routes } from '@angular/router';
import { Login } from './components/layouts/login/login';
import { MainContent } from './components/main-content/main-content';
import { CustomerList } from './components/customer-list/customer-list';
import { LeadList } from './components/lead-list/lead-list';
import { MeetingList } from './components/meeting-list/meeting-list';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: MainContent },
  { path: 'customer', component: CustomerList },
  { path: 'lead', component: LeadList },
  { path: 'meeting', component: MeetingList },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
