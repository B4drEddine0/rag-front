import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthUiActions } from './auth-ui.actions';

export interface AuthUiState {
  loginLoading: boolean;
  loginError: string;
  registerLoading: boolean;
  registerError: string;
  registered: boolean;
}

const initialState: AuthUiState = {
  loginLoading: false,
  loginError: '',
  registerLoading: false,
  registerError: '',
  registered: false
};

export const authUiFeature = createFeature({
  name: 'authUi',
  reducer: createReducer(
    initialState,
    on(AuthUiActions.loginSubmitted, (state) => ({ ...state, loginLoading: true, loginError: '' })),
    on(AuthUiActions.loginSucceeded, (state) => ({ ...state, loginLoading: false })),
    on(AuthUiActions.loginFailed, (state, { error }) => ({ ...state, loginLoading: false, loginError: error })),

    on(AuthUiActions.registerSubmitted, (state) => ({
      ...state,
      registerLoading: true,
      registerError: '',
      registered: false
    })),
    on(AuthUiActions.registerSucceeded, (state) => ({
      ...state,
      registerLoading: false,
      registered: true
    })),
    on(AuthUiActions.registerFailed, (state, { error }) => ({
      ...state,
      registerLoading: false,
      registerError: error
    })),

    on(AuthUiActions.clearErrors, (state) => ({ ...state, loginError: '', registerError: '' })),
    on(AuthUiActions.resetRegisterSuccess, (state) => ({ ...state, registered: false }))
  )
});

export const {
  name: authUiFeatureKey,
  reducer: authUiReducer,
  selectAuthUiState,
  selectLoginLoading,
  selectLoginError,
  selectRegisterLoading,
  selectRegisterError,
  selectRegistered
} = authUiFeature;
