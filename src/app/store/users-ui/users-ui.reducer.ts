import { createFeature, createReducer, on } from '@ngrx/store';
import { UsersUiActions } from './users-ui.actions';

export interface UsersUiState {
  saving: boolean;
  error: string;
  successTick: number;
}

const initialState: UsersUiState = {
  saving: false,
  error: '',
  successTick: 0
};

export const usersUiFeature = createFeature({
  name: 'usersUi',
  reducer: createReducer(
    initialState,
    on(UsersUiActions.createSubmitted, UsersUiActions.updateSubmitted, (state) => ({
      ...state,
      saving: true,
      error: ''
    })),
    on(UsersUiActions.createSucceeded, UsersUiActions.updateSucceeded, (state) => ({
      ...state,
      saving: false,
      successTick: state.successTick + 1
    })),
    on(UsersUiActions.createFailed, UsersUiActions.updateFailed, (state, { error }) => ({
      ...state,
      saving: false,
      error
    })),
    on(UsersUiActions.clearError, (state) => ({ ...state, error: '' }))
  )
});

export const {
  name: usersUiFeatureKey,
  reducer: usersUiReducer,
  selectUsersUiState,
  selectSaving,
  selectError,
  selectSuccessTick
} = usersUiFeature;
