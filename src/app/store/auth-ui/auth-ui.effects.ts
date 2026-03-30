import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { of, timer } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthUiActions } from './auth-ui.actions';
import { getHttpErrorMessage } from '../shared/error-message.util';

@Injectable()
export class AuthUiEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthUiActions.loginSubmitted),
      switchMap(({ email, password }) =>
        this.authService.login({ email, password }).pipe(
          map(() => AuthUiActions.loginSucceeded()),
          catchError((err) => of(AuthUiActions.loginFailed({ error: getHttpErrorMessage(err, 'Login failed. Please verify your credentials.') })))
        )
      )
    )
  );

  readonly loginSuccessNavigate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthUiActions.loginSucceeded),
        tap(() => this.router.navigate(['/dashboard']))
      ),
    { dispatch: false }
  );

  readonly register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthUiActions.registerSubmitted),
      switchMap(({ fullName, email, password, role }) =>
        this.authService.register({ fullName, email, password, role }).pipe(
          map(() => AuthUiActions.registerSucceeded()),
          catchError((err) => of(AuthUiActions.registerFailed({ error: getHttpErrorMessage(err, 'Registration failed. Please try again.') })))
        )
      )
    )
  );

  readonly registerSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthUiActions.registerSucceeded),
        tap(() => this.toast.success('Registration successful.'))
      ),
    { dispatch: false }
  );

  readonly registerSuccessNavigate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthUiActions.registerSucceeded),
        switchMap(() => timer(1500)),
        tap(() => this.router.navigate(['/login']))
      ),
    { dispatch: false }
  );
}
