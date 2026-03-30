import { createFeature, createReducer, on } from '@ngrx/store';
import { OwnershipsUiActions } from './ownerships-ui.actions';

export interface OwnershipsUiState {
  assigning: boolean;
  error: string;
  successTick: number;
}

const initialState: OwnershipsUiState = {
  assigning: false,
  error: '',
  successTick: 0
};

export const ownershipsUiFeature = createFeature({
  name: 'ownershipsUi',
  reducer: createReducer(
    initialState,
    on(OwnershipsUiActions.assignSubmitted, (state) => ({ ...state, assigning: true, error: '' })),
    on(OwnershipsUiActions.assignSucceeded, (state) => ({ ...state, assigning: false, successTick: state.successTick + 1 })),
    on(OwnershipsUiActions.assignFailed, (state, { error }) => ({ ...state, assigning: false, error })),
    on(OwnershipsUiActions.clearError, (state) => ({ ...state, error: '' }))
  )
});

export const {
  name: ownershipsUiFeatureKey,
  reducer: ownershipsUiReducer,
  selectOwnershipsUiState,
  selectAssigning,
  selectError,
  selectSuccessTick
} = ownershipsUiFeature;
