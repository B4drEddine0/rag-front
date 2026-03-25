import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { ApiRole } from '../shared/models/auth.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: ApiRole[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TitleCasePipe,
    ToastComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly role = computed(() => this.authService.role() ?? 'GUEST');
  readonly email = computed(() => this.authService.user()?.email ?? '');
  readonly visibleNavItems = computed(() => {
    const currentRole = this.role() as ApiRole;
    return this.navItems.filter(item => !item.roles || item.roles.includes(currentRole));
  });
  readonly currentPageTitle = signal('Dashboard');

  sidebarOpen = false;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>`, route: '/dashboard' },
    { label: 'Classes', icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>`, route: '/classes' },
    { label: 'Attendance', icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75"/></svg>`, route: '/attendance', roles: ['ADMIN', 'TEACHER'] },
    { label: 'Resources', icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v2.25A2.25 2.25 0 0 1 19.5 18.75h-15a2.25 2.25 0 0 1-2.25-2.25v-2.25"/></svg>`, route: '/resources' },
    { label: 'Users', icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a8.965 8.965 0 0 0 3.75.78 8.966 8.966 0 0 0-2.122-5.879M18 18.72a8.965 8.965 0 0 1-6 2.28 8.966 8.966 0 0 1-6-2.28m12 0a8.966 8.966 0 0 0-2.122-5.879M6 18.72a8.966 8.966 0 0 1 2.122-5.879m0 0a3 3 0 1 1 5.756 0m-5.756 0a8.987 8.987 0 0 1 7.756 0"/></svg>`, route: '/users', roles: ['ADMIN'] },
    { label: 'Enrollments', icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A3.375 3.375 0 0 0 11.25 11.625v2.625m8.25 0v4.875c0 .621-.504 1.125-1.125 1.125H5.625A1.125 1.125 0 0 1 4.5 19.125V14.25m15 0h-15m15 0a1.125 1.125 0 0 0 1.125-1.125V8.625A2.625 2.625 0 0 0 18 6H6a2.625 2.625 0 0 0-2.625 2.625v4.5A1.125 1.125 0 0 0 4.5 14.25"/></svg>`, route: '/enrollments', roles: ['ADMIN'] },
    { label: 'Ownerships', icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 0m5.84 0a6 6 0 1 0-5.84 0m5.84 0A14.923 14.923 0 0 1 18.75 19.5m-9-5.13A14.923 14.923 0 0 0 5.25 19.5"/></svg>`, route: '/ownerships', roles: ['ADMIN'] },
    { label: 'AI Assistant', icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"/></svg>`, route: '/chat' }
  ];

  constructor() {
    this.updateCurrentPageTitle(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.updateCurrentPageTitle(event.urlAfterRedirects));
  }

  safeIcon(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private updateCurrentPageTitle(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const matched = this.navItems.find(item =>
      cleanUrl === item.route || cleanUrl.startsWith(item.route + '/')
    );
    this.currentPageTitle.set(matched?.label ?? 'Dashboard');
  }
}
