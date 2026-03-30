import { ActionReducerMap } from '@ngrx/store';
import { authUiFeatureKey, authUiReducer, AuthUiState } from './auth-ui/auth-ui.reducer';
import { usersUiFeatureKey, usersUiReducer, UsersUiState } from './users-ui/users-ui.reducer';
import { classesUiFeatureKey, classesUiReducer, ClassesUiState } from './classes-ui/classes-ui.reducer';
import { ownershipsUiFeatureKey, ownershipsUiReducer, OwnershipsUiState } from './ownerships-ui/ownerships-ui.reducer';
import { AuthUiEffects } from './auth-ui/auth-ui.effects';
import { UsersUiEffects } from './users-ui/users-ui.effects';
import { ClassesUiEffects } from './classes-ui/classes-ui.effects';
import { OwnershipsUiEffects } from './ownerships-ui/ownerships-ui.effects';

export interface AppStoreState {
  [authUiFeatureKey]: AuthUiState;
  [usersUiFeatureKey]: UsersUiState;
  [classesUiFeatureKey]: ClassesUiState;
  [ownershipsUiFeatureKey]: OwnershipsUiState;
}

export const appReducers: ActionReducerMap<AppStoreState> = {
  [authUiFeatureKey]: authUiReducer,
  [usersUiFeatureKey]: usersUiReducer,
  [classesUiFeatureKey]: classesUiReducer,
  [ownershipsUiFeatureKey]: ownershipsUiReducer
};

export const appEffects = [AuthUiEffects, UsersUiEffects, ClassesUiEffects, OwnershipsUiEffects];
