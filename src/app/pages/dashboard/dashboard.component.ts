import { Component, inject, OnInit } from '@angular/core';
import { ViewStateService, DashboardStatCard } from '../../core/services/view-state.service';
import { AuthService } from '../../core/services/auth.service';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { ActionCardComponent } from '../../components/action-card/action-card.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    StatCardComponent,
    ActionCardComponent,
    PageHeaderComponent
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

  ngOnInit(): void {
    this.viewState.loadDashboard();
  }
}
