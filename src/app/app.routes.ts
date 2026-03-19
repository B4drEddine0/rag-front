import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'classes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/classes/classes.component').then(m => m.ClassesComponent)
  },
  {
    path: 'classes/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/class-details/class-details.component').then(m => m.ClassDetailsComponent)
  },
  {
    path: 'attendance',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/attendance/attendance.component').then(m => m.AttendanceComponent)
  },
  {
    path: 'resources',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/resources/resources.component').then(m => m.ResourcesComponent)
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/chat/chat.component').then(m => m.ChatComponent)
  },
  {
    path: 'users',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./pages/users/users.component').then(m => m.UsersComponent)
  },
  {
    path: 'enrollments',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./pages/enrollments/enrollments.component').then(m => m.EnrollmentsComponent)
  },
  {
    path: 'ownerships',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./pages/ownerships/ownerships.component').then(m => m.OwnershipsComponent)
  },
  { path: '**', redirectTo: '' }
];
