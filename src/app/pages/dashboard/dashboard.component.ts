import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ViewStateService, DashboardStatCard } from '../../core/services/view-state.service';
import { AuthService } from '../../core/services/auth.service';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    StatCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly viewState = inject(ViewStateService);
  private readonly authService = inject(AuthService);

  get stats(): DashboardStatCard[] {
    return this.viewState.dashboardStats();
  }

  get loading(): boolean {
    return this.viewState.dashboardLoading();
  }

  get error(): string {
    return this.viewState.dashboardError();
  }

  get isAdmin(): boolean {
    return this.authService.role() === 'ADMIN';
  }

  get isTeacher(): boolean {
    return this.authService.role() === 'TEACHER';
  }

  get isStudent(): boolean {
    return this.authService.role() === 'STUDENT';
  }

  get showStats(): boolean {
    return this.isAdmin;
  }

  ngOnInit(): void {
    this.viewState.loadDashboard();
  }
}
