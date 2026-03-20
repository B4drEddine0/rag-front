import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { AttendanceRecordService } from '../../core/services/attendance-record.service';
import { AttendanceSessionService } from '../../core/services/attendance-session.service';
import { TeacherService } from '../../core/services/teacher.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ViewStateService, TeacherOption } from '../../core/services/view-state.service';
import { AttendanceRecord } from '../../shared/models/attendance.model';
import { SchoolClass } from '../../shared/models/class.model';
import { TeacherDTO } from '../../shared/models/teacher.model';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceComponent implements OnInit {
  private readonly attendanceRecordService = inject(AttendanceRecordService);
  private readonly attendanceSessionService = inject(AttendanceSessionService);
  private readonly teacherService = inject(TeacherService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly viewState = inject(ViewStateService);

  readonly isAdmin = computed(() => this.authService.role() === 'ADMIN');

  selectedTeacherId = 0;

  selectedClassId = '';
  selectedDate = '';
  saved = false;

  get classes(): SchoolClass[] {
    return this.viewState.attendanceClasses();
  }

  get teacherOptions(): TeacherOption[] {
    return this.viewState.attendanceTeacherOptions();
  }

  get setupLoading(): boolean {
    return this.viewState.attendanceSetupLoading();
  }

  get setupError(): string {
    return this.viewState.attendanceSetupError();
  }

  get records(): AttendanceRecord[] {
    return this.selectedClassId ? (this.viewState.attendanceRecords()[Number(this.selectedClassId)]?.records ?? []) : [];
  }

  get recordsLoading(): boolean {
    return this.selectedClassId ? (this.viewState.attendanceRecords()[Number(this.selectedClassId)]?.loading ?? false) : false;
  }

  get recordsError(): string {
    return this.selectedClassId ? (this.viewState.attendanceRecords()[Number(this.selectedClassId)]?.error ?? '') : '';
  }

  get loaded(): boolean {
    return !!this.selectedClassId && !this.recordsLoading && !this.recordsError && this.records.length > 0;
  }

  get hasSelection(): boolean {
    return !!this.selectedClassId;
  }

  private readonly syncTeacherSelection = effect(() => {
    const options = this.viewState.attendanceTeacherOptions();
    if (this.isAdmin() && !this.selectedTeacherId && options.length) {
      this.selectedTeacherId = options[0].id;
    }
  });

  ngOnInit(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.viewState.loadAttendanceSetup(this.isAdmin());
  }

  loadAttendance(): void {
    if (!this.selectedClassId) return;
    this.saved = false;
    this.viewState.loadAttendanceRecords(Number(this.selectedClassId), true);
  }

  save(): void {
    if (!this.selectedClassId || !this.selectedDate || this.records.length === 0) return;

    if (this.isAdmin()) {
      if (!this.selectedTeacherId) {
        this.toast.error('Please select a teacher for this attendance session.');
        return;
      }
      this.submitSession(this.selectedTeacherId);
    } else {
      this.teacherService.getAll().pipe(timeout(10000), catchError(() => of([]))).subscribe(teachers => {
        const currentUserId = this.authService.userId();
        const teacher = teachers.find((t: TeacherDTO) => t.userId === currentUserId);
        if (!teacher) {
          this.toast.error('Teacher profile not found. Contact administrator.');
          return;
        }
        this.submitSession(teacher.id);
      });
    }
  }

  private submitSession(teacherId: number): void {
    const startTime = this.currentTime();
    const endTime = this.addOneHour(startTime);

    this.attendanceSessionService.create({
      classRoomId: Number(this.selectedClassId),
      teacherId,
      sessionDate: this.selectedDate,
      startTime,
      endTime
    }).subscribe({
      next: session => {
        const createCalls = this.records.map(row =>
          this.attendanceRecordService.create({
            attendanceSessionId: session.id,
            studentId: Number(row.studentId),
            status: row.present ? 'PRESENT' : 'ABSENT',
            justified: row.present ? false : row.justified,
            reason: row.present ? '' : row.reason
          })
        );

        forkJoin(createCalls).subscribe({
          next: () => {
            this.saved = true;
            this.toast.success('Attendance saved successfully.');
            setTimeout(() => this.saved = false, 3000);
          },
          error: () => this.toast.error('Failed to save attendance records.')
        });
      },
      error: () => this.toast.error('Failed to create attendance session.')
    });
  }

  private currentTime(): string {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  private addOneHour(time: string): string {
    const [h, m, s] = time.split(':').map(Number);
    const next = (h + 1) % 24;
    return `${String(next).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
