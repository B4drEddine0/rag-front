import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { OwnershipService } from '../../core/services/ownership.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { ToastService } from '../../shared/services/toast.service';
import { OwnershipsUiActions } from './ownerships-ui.actions';
import { getHttpErrorMessage } from '../shared/error-message.util';

@Injectable()
export class OwnershipsUiEffects {
  private readonly actions$ = inject(Actions);
  private readonly ownershipService = inject(OwnershipService);
  private readonly viewState = inject(ViewStateService);
  private readonly toast = inject(ToastService);

  readonly assign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OwnershipsUiActions.assignSubmitted),
      switchMap(({ classId, teacherId }) =>
        this.ownershipService.create({
          classId,
          classRoomId: classId,
          teacherId,
          assignedAt: new Date().toISOString().split('.')[0],
          status: 'ACTIVE',
          primary: true
        }).pipe(
          map(() => OwnershipsUiActions.assignSucceeded({ classId })),
          catchError((err) => of(OwnershipsUiActions.assignFailed({ error: getHttpErrorMessage(err, 'Unable to assign ownership.') })))
        )
      )
    )
  );

  readonly assignSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(OwnershipsUiActions.assignSucceeded),
        tap(({ classId }) => {
          this.toast.success('Ownership assigned.');
          this.viewState.loadClassOwnerships(classId, true);
        })
      ),
    { dispatch: false }
  );

  readonly assignFailed$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(OwnershipsUiActions.assignFailed),
        tap(({ error }) => this.toast.error(error))
      ),
    { dispatch: false }
  );
}
