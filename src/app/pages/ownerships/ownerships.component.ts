import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { OwnershipService } from '../../core/services/ownership.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-ownerships',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, PageHeaderComponent],
  templateUrl: './ownerships.component.html',
  styleUrl: './ownerships.component.css'
})
export class OwnershipsComponent implements OnInit {
  private readonly ownershipService = inject(OwnershipService);
  private readonly viewState = inject(ViewStateService);
  private readonly toast = inject(ToastService);

  readonly setupState = this.viewState.ownershipsSetup;
  readonly classes = computed(() => this.setupState().classes);
  readonly teachers = computed(() => this.setupState().teachers);
  readonly setupLoading = computed(() => this.setupState().loading);
  readonly setupError = computed(() => this.setupState().error);

  selectedClassId = 0;
  selectedTeacherId = 0;
  saving = false;

  readonly ownershipState = computed(() => this.viewState.ownershipsByClass()[this.selectedClassId]);
  readonly ownerships = computed(() => this.ownershipState()?.ownerships ?? []);
  readonly loadingOwnerships = computed(() => this.ownershipState()?.loading ?? false);

  ngOnInit(): void {
    this.viewState.loadOwnershipsSetup();
  }

  loadClassOwnerships(): void {
    if (this.selectedClassId) {
      this.viewState.loadClassOwnerships(this.selectedClassId);
    }
  }

  createOwnership(): void {
    if (!this.selectedClassId || !this.selectedTeacherId || this.saving) {
      return;
    }

    this.saving = true;
    this.ownershipService
      .create({
        classId: this.selectedClassId,
        classRoomId: this.selectedClassId,
        teacherId: this.selectedTeacherId,
        assignedAt: new Date().toISOString().split('.')[0],
        status: 'ACTIVE',
        primary: true
      })
      .subscribe({
        next: () => {
          this.toast.success('Ownership assigned.');
          this.saving = false;
          this.viewState.loadClassOwnerships(this.selectedClassId, true);
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
          const msg = fieldErrors || flatValidation || err?.error?.message || err?.error?.detail || 'Unable to assign ownership.';
          console.error('Ownership create error:', err);
          this.toast.error(msg);
          this.saving = false;
        }
      });
  }

  endOwnership(id: number): void {
    this.ownershipService
      .end(id)
      .subscribe({
        next: () => {
          this.toast.success('Ownership ended.');
          this.viewState.loadClassOwnerships(this.selectedClassId, true);
        },
        error: (err) => {
          const msg = err?.error?.message || err?.error?.detail || 'Unable to end ownership.';
          console.error('Ownership end error:', err);
          this.toast.error(msg);
        }
      });
  }

  className(id: number): string {
    const cls = this.classes().find((c) => c.id === id);
    return cls ? cls.name : `Class #${id}`;
  }

  teacherName(id: number): string {
    const t = this.teachers().find((u) => u.id === id);
    return t ? t.fullName : `Teacher #${id}`;
  }

  isActive(status: string): boolean {
    return status === 'ACTIVE';
  }
}
