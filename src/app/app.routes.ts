import { Routes } from '@angular/router';
import { Login } from './components/layouts/login/login';
import { MainContent } from './components/main-content/main-content';
import { CustomerList } from './components/customer-list/customer-list';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: MainContent },
  { path: 'customer', component: CustomerList },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
