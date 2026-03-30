import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ClassroomService } from '../../core/services/classroom.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { SchoolClass } from '../../shared/models/class.model';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ClassCardComponent } from '../../components/class-card/class-card.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ClassesUiActions } from '../../store/classes-ui/classes-ui.actions';
import { selectError, selectSaving, selectSuccessTick } from '../../store/classes-ui/classes-ui.reducer';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    ClassCardComponent,
    ConfirmModalComponent
  ],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css'
})
export class ClassesComponent implements OnInit {
  private readonly classroomService = inject(ClassroomService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly viewState = inject(ViewStateService);
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

    if (this.showAddForm) {
      this.newClassName = '';
      this.newYear = new Date().getFullYear();
      this.showAddForm = false;
    }

    if (this.showEditForm) {
      this.cancelEditClass();
    }
  });

  readonly isAdmin = computed(() => this.authService.role() === 'ADMIN');
  readonly isStudent = computed(() => this.authService.role() === 'STUDENT');

  get classes(): SchoolClass[] {
    return this.viewState.classes();
  }

  get loading(): boolean {
    return this.viewState.classesLoading();
  }

  get error(): string {
    return this.viewState.classesError();
  }

  showAddForm = false;
  showEditForm = false;
  editingClassId: number | null = null;
  newClassName = '';
  newYear = new Date().getFullYear();
  editClassName = '';
  editYear = new Date().getFullYear();
  showDeleteConfirm = false;
  pendingDeleteClass: SchoolClass | null = null;

  ngOnInit(): void {
    this.loadClasses(true);
  }

  loadClasses(force = false): void {
    this.viewState.loadClasses(force);
  }

  createClass(): void {
    if (this.saving()) return;
    if (!this.newClassName.trim() || !this.newYear) return;
    this.store.dispatch(ClassesUiActions.createSubmitted({ name: this.newClassName.trim(), year: this.newYear }));
  }

  startEditClass(cls: SchoolClass): void {
    const classId = Number(cls.id);
    if (!classId) return;
    this.editingClassId = classId;
    this.editClassName = cls.name;
    this.editYear = cls.year ?? (Number(String(cls.grade).replace(/[^0-9]/g, '')) || new Date().getFullYear());
    this.showEditForm = true;
    this.store.dispatch(ClassesUiActions.clearError());
  }

  cancelEditClass(): void {
    this.showEditForm = false;
    this.editingClassId = null;
    this.editClassName = '';
    this.editYear = new Date().getFullYear();
    this.store.dispatch(ClassesUiActions.clearError());
  }

  saveEditClass(): void {
    if (this.saving()) return;
    if (!this.editingClassId || !this.editClassName.trim() || !this.editYear) return;
    this.store.dispatch(ClassesUiActions.updateSubmitted({
      id: this.editingClassId,
      name: this.editClassName.trim(),
      year: this.editYear
    }));
  }

  requestDeleteClass(cls: SchoolClass): void {
    this.pendingDeleteClass = cls;
    this.showDeleteConfirm = true;
  }

  cancelDeleteClass(): void {
    this.showDeleteConfirm = false;
    this.pendingDeleteClass = null;
  }

  confirmDeleteClass(): void {
    const cls = this.pendingDeleteClass;
    if (!cls) return;

    const classId = Number(cls.id);
    if (!classId) {
      this.cancelDeleteClass();
      return;
    }

    this.classroomService.delete(classId).subscribe({
      next: () => {
        this.toast.success('Class deleted successfully.');
        this.cancelDeleteClass();
        this.viewState.loadClasses(true);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to delete class.';
        this.toast.error(msg);
        this.cancelDeleteClass();
      }
    });
  }
}

