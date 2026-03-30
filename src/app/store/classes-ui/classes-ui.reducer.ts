import { createFeature, createReducer, on } from '@ngrx/store';
import { ClassesUiActions } from './classes-ui.actions';

export interface ClassesUiState {
  saving: boolean;
  error: string;
  successTick: number;
}

const initialState: ClassesUiState = {
  saving: false,
  error: '',
  successTick: 0
};

export const classesUiFeature = createFeature({
  name: 'classesUi',
  reducer: createReducer(
    initialState,
    on(ClassesUiActions.createSubmitted, ClassesUiActions.updateSubmitted, (state) => ({
      ...state,
      saving: true,
      error: ''
    })),
    on(ClassesUiActions.createSucceeded, ClassesUiActions.updateSucceeded, (state) => ({
      ...state,
      saving: false,
      successTick: state.successTick + 1
    })),
    on(ClassesUiActions.createFailed, ClassesUiActions.updateFailed, (state, { error }) => ({
      ...state,
      saving: false,
      error
    })),
    on(ClassesUiActions.clearError, (state) => ({ ...state, error: '' }))
  )
});

export const {
  name: classesUiFeatureKey,
  reducer: classesUiReducer,
  selectClassesUiState,
  selectSaving,
  selectError,
  selectSuccessTick
} = classesUiFeature;
