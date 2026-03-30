import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';

import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { OwnershipService } from '../../core/services/ownership.service';
import { ViewStateService } from '../../core/services/view-state.service';
import { ToastService } from '../../shared/services/toast.service';
import { OwnershipsUiActions } from '../../store/ownerships-ui/ownerships-ui.actions';
import { selectAssigning, selectError } from '../../store/ownerships-ui/ownerships-ui.reducer';

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
  private readonly store = inject(Store);
  readonly assigning = this.store.selectSignal(selectAssigning);
  readonly assignError = this.store.selectSignal(selectError);

  readonly setupState = this.viewState.ownershipsSetup;
  readonly classes = computed(() => this.setupState().classes);
  readonly teachers = computed(() => this.setupState().teachers);
  readonly setupLoading = computed(() => this.setupState().loading);
  readonly setupError = computed(() => this.setupState().error);

  selectedClassId = 0;
  selectedTeacherId = 0;

  get ownershipState() {
    return this.viewState.ownershipsByClass()[this.selectedClassId];
  }

  get ownerships() {
    return this.ownershipState?.ownerships ?? [];
  }

  get loadingOwnerships() {
    return this.ownershipState?.loading ?? false;
  }

  ngOnInit(): void {
    this.viewState.loadOwnershipsSetup();
  }

  loadClassOwnerships(): void {
    if (this.selectedClassId) {
      this.viewState.loadClassOwnerships(this.selectedClassId);
    }
  }

  createOwnership(): void {
    if (!this.selectedClassId || !this.selectedTeacherId || this.assigning()) {
      return;
    }

    this.store.dispatch(OwnershipsUiActions.assignSubmitted({
      classId: this.selectedClassId,
      teacherId: this.selectedTeacherId
    }));
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
