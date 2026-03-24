import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../shared/models/auth.model';

const AUTH_KEY = 'auth_user';
const BASE = 'http://localhost:8080/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<AuthResponse | null>(this.loadFromStorage());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly role = computed(() => this._user()?.role ?? null);
  readonly token = computed(() => this._user()?.token ?? null);
  readonly userId = computed(() => this._user()?.userId ?? null);
  readonly teacherId = computed(() => this._user()?.teacherId ?? null);
  readonly studentId = computed(() => this._user()?.studentId ?? null);
  readonly fullName = computed(() => this._user()?.fullName ?? null);

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/login`, req).pipe(
      tap(res => this.persist(res))
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/register`, req).pipe(
      tap(res => this.persist(res))
    );
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem(AUTH_KEY);
    this.router.navigate(['/login']);
  }

  private persist(res: AuthResponse): void {
    this._user.set(res);
    localStorage.setItem(AUTH_KEY, JSON.stringify(res));
  }

  private loadFromStorage(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }
}
