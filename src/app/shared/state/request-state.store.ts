import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class RequestStateStore {
  private readonly _loading = signal(false);
  private readonly _error = signal('');

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  run<T>(source$: Observable<T>): Observable<T> {
    this._error.set('');
    this._loading.set(true);
    return source$.pipe(finalize(() => this._loading.set(false)));
  }

  setError(message: string): void {
    this._error.set(message);
  }

  clearError(): void {
    this._error.set('');
  }
}
