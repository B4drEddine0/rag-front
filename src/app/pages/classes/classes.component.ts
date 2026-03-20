import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClassroomService } from '../../core/services/classroom.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { SchoolClass } from '../../shared/models/class.model';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { ClassCardComponent } from '../../components/class-card/class-card.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    ClassCardComponent
  ],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css'
})
export class ClassesComponent implements OnInit {
  private readonly classroomService = inject(ClassroomService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly viewState = inject(ViewStateService);

  readonly isAdmin = computed(() => this.authService.role() === 'ADMIN');

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
  saving = false;

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(force = false): void {
    this.viewState.loadClasses(force);
  }

  createClass(): void {
    if (!this.newClassName.trim() || !this.newYear) return;
    this.saving = true;
    this.classroomService.create({ name: this.newClassName.trim(), year: this.newYear }).subscribe({
      next: () => {
        this.toast.success('Class created successfully.');
        this.newClassName = '';
        this.newYear = new Date().getFullYear();
        this.showAddForm = false;
        this.saving = false;
        this.viewState.loadClasses(true);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to create class.';
        this.toast.error(msg);
        this.saving = false;
      }
    });
  }

  startEditClass(cls: SchoolClass): void {
    const classId = Number(cls.id);
    if (!classId) return;
    this.editingClassId = classId;
    this.editClassName = cls.name;
    this.editYear = cls.year ?? (Number(String(cls.grade).replace(/[^0-9]/g, '')) || new Date().getFullYear());
    this.showEditForm = true;
  }

  cancelEditClass(): void {
    this.showEditForm = false;
    this.editingClassId = null;
    this.editClassName = '';
    this.editYear = new Date().getFullYear();
  }

  saveEditClass(): void {
    if (!this.editingClassId || !this.editClassName.trim() || !this.editYear) return;
    this.saving = true;
    this.classroomService.update(this.editingClassId, {
      name: this.editClassName.trim(),
      year: this.editYear
    }).subscribe({
      next: () => {
        this.toast.success('Class updated successfully.');
        this.saving = false;
        this.cancelEditClass();
        this.viewState.loadClasses(true);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to update class.';
        this.toast.error(msg);
        this.saving = false;
      }
    });
  }

  deleteClass(cls: SchoolClass): void {
    const classId = Number(cls.id);
    if (!classId) return;
    if (!confirm(`Delete class "${cls.name}"?`)) return;
    this.classroomService.delete(classId).subscribe({
      next: () => {
        this.toast.success('Class deleted successfully.');
        this.viewState.loadClasses(true);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to delete class.';
        this.toast.error(msg);
      }
    });
  }
}

