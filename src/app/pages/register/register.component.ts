import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiRole } from '../../shared/models/auth.model';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  readonly roles: ApiRole[] = ['ADMIN', 'TEACHER', 'STUDENT'];
  fullName = '';
  email = '';
  password = '';
  selectedRole: ApiRole = 'STUDENT';
  hidePassword = true;
  registered = false;
  loading = false;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  submit(): void {
    if (!this.fullName || !this.email || !this.password) return;
    this.loading = true;
    this.authService.register({
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      role: this.selectedRole
    }).subscribe({
      next: () => {
        this.loading = false;
        this.registered = true;
        this.toast.success('Registration successful.');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: () => {
        this.loading = false;
        this.toast.error('Registration failed. Please try again.');
      }
    });
  }
}
