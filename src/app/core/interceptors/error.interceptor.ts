import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const isAuthRequest = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');

  return next(req).pipe(
    catchError(err => {
      const status: number = err.status;
      if (status === 401) {
        if (isAuthRequest) {
          const msg = err?.error?.message;
          toast.error(typeof msg === 'string' && msg.trim() ? msg : 'Invalid email or password.');
        } else {
          auth.logout();
          toast.error('Session expired. Please log in again.');
        }
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (status === 404) {
        toast.error('The requested resource was not found.');
      } else if (status === 400) {
        const validationErrors = err?.error?.errors;
        const flatValidation = err?.error && typeof err.error === 'object'
          ? Object.entries(err.error)
              .filter(([k, v]) => typeof v === 'string' && !['message', 'detail', 'timestamp', 'path'].includes(k))
              .map(([, v]) => v as string)
              .join(', ')
          : '';
        const fieldErrors = validationErrors && typeof validationErrors === 'object'
          ? Object.values(validationErrors).join(', ')
          : '';
        const msg = fieldErrors || flatValidation || err.error?.message || 'Invalid request. Please check your input.';
        toast.error(msg);
      } else if (status >= 500) {
        toast.error('A server error occurred. Please try again later.');
      }
      return throwError(() => err);
    })
  );
};
