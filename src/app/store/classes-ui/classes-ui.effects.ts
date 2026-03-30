import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ClassroomService } from '../../core/services/classroom.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { ToastService } from '../../shared/services/toast.service';
import { ClassesUiActions } from './classes-ui.actions';
import { getHttpErrorMessage } from '../shared/error-message.util';

@Injectable()
export class ClassesUiEffects {
  private readonly actions$ = inject(Actions);
  private readonly classroomService = inject(ClassroomService);
  private readonly viewState = inject(ViewStateService);
  private readonly toast = inject(ToastService);

  readonly create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClassesUiActions.createSubmitted),
      switchMap(({ name, year }) =>
        this.classroomService.create({ name, year }).pipe(
          map(() => ClassesUiActions.createSucceeded()),
          catchError((err) => of(ClassesUiActions.createFailed({ error: getHttpErrorMessage(err, 'Failed to create class.') })))
        )
      )
    )
  );

  readonly update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClassesUiActions.updateSubmitted),
      switchMap(({ id, name, year }) =>
        this.classroomService.update(id, { name, year }).pipe(
          map(() => ClassesUiActions.updateSucceeded()),
          catchError((err) => of(ClassesUiActions.updateFailed({ error: getHttpErrorMessage(err, 'Failed to update class.') })))
        )
      )
    )
  );

  readonly createSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ClassesUiActions.createSucceeded),
        tap(() => {
          this.toast.success('Class created successfully.');
          this.viewState.loadClasses(true);
        })
      ),
    { dispatch: false }
  );

  readonly updateSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ClassesUiActions.updateSucceeded),
        tap(() => {
          this.toast.success('Class updated successfully.');
          this.viewState.loadClasses(true);
        })
      ),
    { dispatch: false }
  );

  readonly failToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ClassesUiActions.createFailed, ClassesUiActions.updateFailed),
        tap(({ error }) => this.toast.error(error))
      ),
    { dispatch: false }
  );
}
