import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { UserDTO } from '../../shared/models/user.model';
import { ApiRole } from '../../shared/models/auth.model';
import { ToastService } from '../../shared/services/toast.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly viewState = inject(ViewStateService);
  private readonly toast = inject(ToastService);

  readonly roles: ApiRole[] = ['ADMIN', 'TEACHER', 'STUDENT'];

  readonly loading = this.viewState.usersLoading;
  readonly error = this.viewState.usersError;
  readonly users = this.viewState.users;

  showForm = false;
  editingId: number | null = null;
  saving = false;

  form = {
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT' as ApiRole
  };

  ngOnInit(): void {
    this.viewState.loadUsers();
  }

  startCreate(): void {
    this.editingId = null;
    this.form = { fullName: '', email: '', password: '', role: 'STUDENT' };
    this.showForm = true;
  }

  startEdit(user: UserDTO): void {
    this.editingId = user.id;
    this.form = {
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  save(): void {
    if (!this.form.fullName.trim() || !this.form.email.trim()) return;
    this.saving = true;

    if (this.editingId) {
      if (!this.form.password.trim()) {
        this.toast.error('Password is required when updating a user.');
        this.saving = false;
        return;
      }

      const payload: Omit<UserDTO, 'id'> = {
        fullName: this.form.fullName.trim(),
        email: this.form.email.trim(),
        password: this.form.password.trim(),
        role: this.form.role
      };
      this.userService.update(this.editingId, payload).subscribe({
        next: () => {
          this.toast.success('User updated successfully.');
          this.saving = false;
          this.showForm = false;
          this.viewState.loadUsers(true);
        },
        error: (err) => {
          const validationErrors = err?.error?.errors;
          const fieldErrors = validationErrors && typeof validationErrors === 'object'
            ? Object.values(validationErrors).join(', ')
            : '';
          const msg = fieldErrors || err?.error?.message || err?.error?.detail || 'Failed to update user.';
          console.error('User update error:', err);
          this.toast.error(msg);
          this.saving = false;
        }
      });
      return;
    }

    if (!this.form.password.trim()) {
      this.toast.error('Password is required when creating a user.');
      this.saving = false;
      return;
    }

    this.userService.create({
      fullName: this.form.fullName.trim(),
      email: this.form.email.trim(),
      password: this.form.password.trim(),
      role: this.form.role
    }).subscribe({
      next: () => {
        this.toast.success('User created successfully.');
        this.saving = false;
        this.showForm = false;
        this.viewState.loadUsers(true);
      },
      error: (err) => {
        const validationErrors = err?.error?.errors;
        const fieldErrors = validationErrors && typeof validationErrors === 'object'
          ? Object.values(validationErrors).join(', ')
          : '';
        const msg = fieldErrors || err?.error?.message || err?.error?.detail || 'Failed to create user.';
        console.error('User create error:', err);
        this.toast.error(msg);
        this.saving = false;
      }
    });
  }

  deleteUser(id: number): void {
    if (!confirm('Delete this user?')) return;
    this.userService.delete(id).subscribe({
      next: () => {
        this.toast.success('User deleted.');
        this.viewState.loadUsers(true);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to delete user.';
        console.error('User delete error:', err);
        this.toast.error(msg);
      }
    });
  }
}
