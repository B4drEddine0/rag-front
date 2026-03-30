import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { ToastService } from '../../shared/services/toast.service';
import { UsersUiActions } from './users-ui.actions';
import { getHttpErrorMessage } from '../shared/error-message.util';

@Injectable()
export class UsersUiEffects {
  private readonly actions$ = inject(Actions);
  private readonly userService = inject(UserService);
  private readonly viewState = inject(ViewStateService);
  private readonly toast = inject(ToastService);

  readonly create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersUiActions.createSubmitted),
      switchMap(({ fullName, email, password, role }) =>
        this.userService.create({ fullName, email, password, role }).pipe(
          map(() => UsersUiActions.createSucceeded()),
          catchError((err) => of(UsersUiActions.createFailed({ error: getHttpErrorMessage(err, 'Failed to create user.') })))
        )
      )
    )
  );

  readonly update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersUiActions.updateSubmitted),
      switchMap(({ id, fullName, email, password, role }) =>
        this.userService.update(id, { fullName, email, password, role }).pipe(
          map(() => UsersUiActions.updateSucceeded()),
          catchError((err) => of(UsersUiActions.updateFailed({ error: getHttpErrorMessage(err, 'Failed to update user.') })))
        )
      )
    )
  );

  readonly createSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UsersUiActions.createSucceeded),
        tap(() => {
          this.toast.success('User created successfully.');
          this.viewState.loadUsers(true);
        })
      ),
    { dispatch: false }
  );

  readonly updateSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UsersUiActions.updateSucceeded),
        tap(() => {
          this.toast.success('User updated successfully.');
          this.viewState.loadUsers(true);
        })
      ),
    { dispatch: false }
  );

  readonly failToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UsersUiActions.createFailed, UsersUiActions.updateFailed),
        tap(({ error }) => this.toast.error(error))
      ),
    { dispatch: false }
  );
}
