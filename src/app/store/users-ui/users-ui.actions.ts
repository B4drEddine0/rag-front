import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ApiRole } from '../../shared/models/auth.model';

export const UsersUiActions = createActionGroup({
  source: 'Users UI',
  events: {
    CreateSubmitted: props<{ fullName: string; email: string; password: string; role: ApiRole }>(),
    CreateSucceeded: emptyProps(),
    CreateFailed: props<{ error: string }>(),

    UpdateSubmitted: props<{ id: number; fullName: string; email: string; password?: string; role: ApiRole }>(),
    UpdateSucceeded: emptyProps(),
    UpdateFailed: props<{ error: string }>(),

    ClearError: emptyProps()
  }
});
