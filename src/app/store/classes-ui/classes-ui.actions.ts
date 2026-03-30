import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const ClassesUiActions = createActionGroup({
  source: 'Classes UI',
  events: {
    CreateSubmitted: props<{ name: string; year: number }>(),
    CreateSucceeded: emptyProps(),
    CreateFailed: props<{ error: string }>(),

    UpdateSubmitted: props<{ id: number; name: string; year: number }>(),
    UpdateSucceeded: emptyProps(),
    UpdateFailed: props<{ error: string }>(),

    ClearError: emptyProps()
  }
});
