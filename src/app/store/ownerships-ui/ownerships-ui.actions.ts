import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const OwnershipsUiActions = createActionGroup({
  source: 'Ownerships UI',
  events: {
    AssignSubmitted: props<{ classId: number; teacherId: number }>(),
    AssignSucceeded: props<{ classId: number }>(),
    AssignFailed: props<{ error: string }>(),
    ClearError: emptyProps()
  }
});
