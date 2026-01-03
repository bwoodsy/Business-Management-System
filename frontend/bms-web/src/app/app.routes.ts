import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

import { Shell } from './layout/shell/shell';
import { ProductsComponent } from './pages/products/products.component';
import { JobsComponent } from './pages/jobs/jobs.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'products', component: ProductsComponent },
      { path: 'jobs', component: JobsComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: '', pathMatch: 'full', redirectTo: 'products' }
    ]
  }
];
