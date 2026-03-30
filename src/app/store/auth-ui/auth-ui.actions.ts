import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ApiRole } from '../../shared/models/auth.model';

export const AuthUiActions = createActionGroup({
  source: 'Auth UI',
  events: {
    LoginSubmitted: props<{ email: string; password: string }>(),
    LoginSucceeded: emptyProps(),
    LoginFailed: props<{ error: string }>(),

    RegisterSubmitted: props<{ fullName: string; email: string; password: string; role: ApiRole }>(),
    RegisterSucceeded: emptyProps(),
    RegisterFailed: props<{ error: string }>(),

    ClearErrors: emptyProps(),
    ResetRegisterSuccess: emptyProps()
  }
});
