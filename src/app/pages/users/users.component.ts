import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { UserService } from '../../core/services/user.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { UserDTO } from '../../shared/models/user.model';
import { ApiRole } from '../../shared/models/auth.model';
import { ToastService } from '../../shared/services/toast.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { UsersUiActions } from '../../store/users-ui/users-ui.actions';
import { selectError, selectSaving, selectSuccessTick } from '../../store/users-ui/users-ui.reducer';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ConfirmModalComponent],
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
  private readonly store = inject(Store);
  readonly saving = this.store.selectSignal(selectSaving);
  readonly saveError = this.store.selectSignal(selectError);
  readonly successTick = this.store.selectSignal(selectSuccessTick);

  private lastHandledSuccessTick = 0;
  private readonly handleSuccess = effect(() => {
    const tick = this.successTick();
    if (!tick || tick === this.lastHandledSuccessTick) {
      return;
    }

    this.lastHandledSuccessTick = tick;
    this.showForm = false;
    this.editingId = null;
    this.form = { fullName: '', email: '', password: '', role: 'STUDENT' };
  });

  showForm = false;
  editingId: number | null = null;
  showDeleteConfirm = false;
  pendingDeleteUser: UserDTO | null = null;

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
    this.store.dispatch(UsersUiActions.clearError());
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
    this.store.dispatch(UsersUiActions.clearError());
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.store.dispatch(UsersUiActions.clearError());
  }

  save(): void {
    if (this.saving()) return;
    if (!this.form.fullName.trim() || !this.form.email.trim()) return;

    if (this.editingId) {
      const password = this.form.password.trim();
      this.store.dispatch(UsersUiActions.updateSubmitted({
        id: this.editingId,
        fullName: this.form.fullName.trim(),
        email: this.form.email.trim(),
        password: password || undefined,
        role: this.form.role
      }));
      return;
    }

    if (!this.form.password.trim()) {
      this.toast.error('Password is required when creating a user.');
      this.store.dispatch(UsersUiActions.createFailed({ error: 'Password is required when creating a user.' }));
      return;
    }

    this.store.dispatch(UsersUiActions.createSubmitted({
      fullName: this.form.fullName.trim(),
      email: this.form.email.trim(),
      password: this.form.password.trim(),
      role: this.form.role
    }));
  }

  requestDeleteUser(user: UserDTO): void {
    this.pendingDeleteUser = user;
    this.showDeleteConfirm = true;
  }

  cancelDeleteUser(): void {
    this.showDeleteConfirm = false;
    this.pendingDeleteUser = null;
  }

  confirmDeleteUser(): void {
    const user = this.pendingDeleteUser;
    if (!user) return;

    const id = Number(user.id);
    if (!id) {
      this.cancelDeleteUser();
      return;
    }

    this.userService.delete(id).subscribe({
      next: () => {
        this.toast.success('User deleted.');
        this.cancelDeleteUser();
        this.viewState.loadUsers(true);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to delete user.';
        console.error('User delete error:', err);
        this.toast.error(msg);
        this.cancelDeleteUser();
      }
    });
  }
}
