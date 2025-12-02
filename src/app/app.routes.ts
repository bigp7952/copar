import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'clients', loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent) },
      { path: 'payments', loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent) },
      { path: 'expenses', loadComponent: () => import('./pages/expenses/expenses.component').then(m => m.ExpensesComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: 'feedback/:token',
    loadComponent: () => import('./pages/feedback-public/feedback-public.component').then(m => m.FeedbackPublicComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
