import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ApiRole } from '../../shared/models/auth.model';
import { AuthUiActions } from '../../store/auth-ui/auth-ui.actions';
import { selectRegistered, selectRegisterError, selectRegisterLoading } from '../../store/auth-ui/auth-ui.reducer';

const STRICT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit, OnDestroy {
  readonly roles: ApiRole[] = ['ADMIN', 'TEACHER', 'STUDENT'];
  hidePassword = true;

  readonly store = inject(Store);
  readonly loading = this.store.selectSignal(selectRegisterLoading);
  readonly serverError = this.store.selectSignal(selectRegisterError);
  readonly registered = this.store.selectSignal(selectRegistered);

  readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(STRICT_EMAIL_PATTERN)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    selectedRole: ['STUDENT' as ApiRole, [Validators.required]]
  });

  ngOnInit(): void {
    this.store.dispatch(AuthUiActions.resetRegisterSuccess());
    this.store.dispatch(AuthUiActions.clearErrors());
  }

  ngOnDestroy(): void {
    this.store.dispatch(AuthUiActions.clearErrors());
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const { fullName, email, password, selectedRole } = this.form.getRawValue();
    this.store.dispatch(AuthUiActions.registerSubmitted({
      fullName,
      email,
      password,
      role: selectedRole
    }));
  }

  controlTouchedAndInvalid(name: 'fullName' | 'email' | 'password' | 'selectedRole'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }
}
