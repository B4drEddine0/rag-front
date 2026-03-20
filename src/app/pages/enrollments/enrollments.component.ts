import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { ToastService } from '../../shared/services/toast.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './enrollments.component.html',
  styleUrl: './enrollments.component.css'
})
export class EnrollmentsComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly viewState = inject(ViewStateService);
  private readonly toast = inject(ToastService);

  readonly setupState = this.viewState.enrollmentsSetup;
  readonly classes = computed(() => this.setupState().classes);
  readonly students = computed(() => this.setupState().students);
  readonly setupLoading = computed(() => this.setupState().loading);
  readonly setupError = computed(() => this.setupState().error);

  selectedClassId = 0;
  selectedStudentId = 0;

  readonly enrollmentState = computed(() => this.viewState.enrollmentsByClass()[this.selectedClassId]);
  readonly enrollments = computed(() => this.enrollmentState()?.enrollments ?? []);
  readonly loadingEnrollments = computed(() => this.enrollmentState()?.loading ?? false);

  ngOnInit(): void {
    this.viewState.loadEnrollmentsSetup();
  }

  loadClassEnrollments(): void {
    if (this.selectedClassId) {
      this.viewState.loadClassEnrollments(this.selectedClassId);
    }
  }

  createEnrollment(): void {
    if (!this.selectedClassId || !this.selectedStudentId) return;

    this.enrollmentService.create({
      classId: this.selectedClassId,
      classRoomId: this.selectedClassId,
      studentId: this.selectedStudentId,
      status: 'ACTIVE',
      enrolledAt: new Date().toISOString().split('.')[0]
    }).subscribe({
      next: () => {
        this.toast.success('Enrollment created successfully.');
        this.viewState.loadClassEnrollments(this.selectedClassId, true);
      },
      error: (err) => {
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
        const msg = fieldErrors || flatValidation || err?.error?.message || err?.error?.detail || 'Failed to create enrollment.';
        console.error('Enrollment create error:', err);
        this.toast.error(msg);
      }
    });
  }

  endEnrollment(id: number): void {
    this.enrollmentService.end(id).subscribe({
      next: () => {
        this.toast.success('Enrollment ended.');
        this.viewState.loadClassEnrollments(this.selectedClassId, true);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.detail || 'Failed to end enrollment.';
        console.error('Enrollment end error:', err);
        this.toast.error(msg);
      }
    });
  }

  className(id: number): string {
    const cls = this.classes().find(c => c.id === id);
    return cls ? cls.name : `Class #${id}`;
  }

  studentName(studentId: number): string {
    const student = this.students().find(s => s.id === studentId);
    return student?.fullName ?? `Student #${studentId}`;
  }
}
