import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap, timeout } from 'rxjs/operators';
import { ClassroomService } from './classroom.service';
import { EnrollmentService } from './enrollment.service';
import { OwnershipService } from './ownership.service';
import { ResourceService } from './resource.service';
import { StudentService } from './student.service';
import { TeacherService } from './teacher.service';
import { UserService } from './user.service';
import { AttendanceRecordService } from './attendance-record.service';
import { ChatService } from './chat.service';
import { AttendanceRecord } from '../../shared/models/attendance.model';
import { SchoolClass, Student } from '../../shared/models/class.model';
import { Resource } from '../../shared/models/resource.model';
import { ChatMessage } from '../../shared/models/chat.model';
import { ChatMode } from '../../shared/models/chat-api.model';
import { AuthService } from './auth.service';

export interface ClassDetailsState {
  loading: boolean;
  error: string;
  schoolClass?: SchoolClass;
  students: Student[];
  resources: Resource[];
}

export interface DashboardStatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export interface TeacherOption {
  id: number;
  label: string;
}

export interface AttendanceRecordsState {
  loading: boolean;
  error: string;
  records: AttendanceRecord[];
}

export interface UsersState {
  loading: boolean;
  error: string;
  users: UserService extends { getAll(): any; create(...args: any[]): any } ? any : any[];
}

export interface EnrollmentsSetupState {
  loading: boolean;
  error: string;
  classes: any[];
  students: any[];
}

export interface EnrollmentsByClassState {
  loading: boolean;
  error: string;
  enrollments: any[];
}

export interface OwnershipsSetupState {
  loading: boolean;
  error: string;
  classes: any[];
  teachers: any[];
}

export interface OwnershipsByClassState {
  loading: boolean;
  error: string;
  ownerships: any[];
}

@Injectable({ providedIn: 'root' })
export class ViewStateService {
  private static readonly CHAT_STORAGE_PREFIX = 'chat_history_user_';

  private readonly classroomService = inject(ClassroomService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly ownershipService = inject(OwnershipService);
  private readonly resourceService = inject(ResourceService);
  private readonly studentService = inject(StudentService);
  private readonly teacherService = inject(TeacherService);
  private readonly userService = inject(UserService);
  private readonly attendanceRecordService = inject(AttendanceRecordService);
  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);

  readonly classes = signal<SchoolClass[]>([]);
  readonly classesLoading = signal(false);
  readonly classesError = signal('');
  readonly classesLoaded = signal(false);

  readonly resources = signal<Resource[]>([]);
  readonly resourcesLoading = signal(false);
  readonly resourcesError = signal('');
  readonly resourcesLoaded = signal(false);

  readonly classDetails = signal<Record<number, ClassDetailsState>>({});

  readonly dashboardStats = signal<DashboardStatCard[]>([]);
  readonly dashboardLoading = signal(false);
  readonly dashboardError = signal('');
  readonly dashboardLoaded = signal(false);

  readonly attendanceClasses = signal<SchoolClass[]>([]);
  readonly attendanceTeacherOptions = signal<TeacherOption[]>([]);
  readonly attendanceSetupLoading = signal(false);
  readonly attendanceSetupError = signal('');
  readonly attendanceSetupLoaded = signal(false);
  readonly attendanceRecords = signal<Record<number, AttendanceRecordsState>>({});

  readonly chatMessages = signal<ChatMessage[]>([]);
  readonly chatLoading = signal(false);
  readonly chatError = signal('');
  readonly chatFallbackBanner = signal(false);

  readonly users = signal<any[]>([]);
  readonly usersLoading = signal(false);
  readonly usersError = signal('');
  readonly usersLoaded = signal(false);

  readonly enrollmentsSetup = signal<EnrollmentsSetupState>({
    loading: false,
    error: '',
    classes: [],
    students: []
  });
  readonly enrollmentsByClass = signal<Record<number, EnrollmentsByClassState>>({});

  readonly ownershipsSetup = signal<OwnershipsSetupState>({
    loading: false,
    error: '',
    classes: [],
    teachers: []
  });
  readonly ownershipsByClass = signal<Record<number, OwnershipsByClassState>>({});

  private readonly CHAT_FALLBACK_PHRASES = ['provider unavailable', 'external provider', 'ai provider', 'fallback'];

  hydrateChatForCurrentUser(): void {
    const key = this.chatStorageKey();
    if (!key) {
      this.chatMessages.set([]);
      this.chatError.set('');
      this.chatFallbackBanner.set(false);
      this.chatLoading.set(false);
      return;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        this.chatMessages.set([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.chatMessages.set([]);
        return;
      }

      const hydrated = parsed
        .filter(item => !!item && typeof item === 'object')
        .map(item => ({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: typeof item.content === 'string' ? item.content : '',
          citation: typeof item.citation === 'string' ? item.citation : undefined,
          sources: Array.isArray(item.sources) ? item.sources.filter((src: unknown): src is string => typeof src === 'string') : undefined,
          mode: item.mode,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
        })) as ChatMessage[];

      this.chatMessages.set(hydrated);
      this.chatError.set('');
      this.chatLoading.set(false);
    } catch {
      this.chatMessages.set([]);
    }
  }

  loadClasses(force = false): void {
    if (this.classesLoading()) return;
    if (this.classesLoaded() && !force) return;

    this.classesLoading.set(true);
    this.classesError.set('');

    const watchdog = setTimeout(() => {
      if (this.classesLoading()) {
        this.classesError.set('Loading classes timed out. Please retry.');
        this.classesLoading.set(false);
      }
    }, 15000);

    this.getClassroomsForCurrentRole().pipe(
      timeout(10000),
      catchError(() => {
        this.classesError.set('Failed to load classes. Please try again.');
        return of([]);
      })
    ).subscribe(classrooms => {
      const classList = Array.isArray(classrooms) ? classrooms : [];
      if (!classList.length) {
        this.classes.set([]);
        this.classesLoaded.set(true);
        this.classesLoading.set(false);
        clearTimeout(watchdog);
        return;
      }

      const calls = classList.map(cls =>
        forkJoin({
          enrollments: this.enrollmentService.getByClass(cls.id).pipe(timeout(8000), catchError(() => of([]))),
          ownerships: this.ownershipService.getByClass(cls.id).pipe(timeout(8000), catchError(() => of([]))),
          resources: this.resourceService.getByClass(cls.id).pipe(timeout(8000), catchError(() => of([])))
        })
      );

      forkJoin(calls).pipe(
        timeout(12000),
        finalize(() => {
          this.classesLoading.set(false);
          clearTimeout(watchdog);
        })
      ).subscribe({
        next: details => {
          this.classes.set(classList.map((cls, index) => ({
            id: String(cls?.id ?? ''),
            name: cls?.name ?? 'Class',
            grade: `Year ${cls?.year ?? '-'}`,
            year: cls?.year,
            studentsCount: Array.isArray(details[index]?.enrollments) ? details[index].enrollments.length : 0,
            teachers: Array(Array.isArray(details[index]?.ownerships) ? details[index].ownerships.length : 0).fill('Teacher'),
            resources: Array(Array.isArray(details[index]?.resources) ? details[index].resources.length : 0).fill('Resource')
          })));
          this.classesLoaded.set(true);
        },
        error: () => {
          this.classesError.set('Failed to load class details. Please try again.');
        }
      });
    });
  }

  loadResources(force = false): void {
    if (this.resourcesLoading()) return;
    if (this.resourcesLoaded() && !force) return;

    this.resourcesLoading.set(true);
    this.resourcesError.set('');

    const watchdog = setTimeout(() => {
      if (this.resourcesLoading()) {
        this.resourcesError.set('Loading resources timed out. Please retry.');
        this.resourcesLoading.set(false);
      }
    }, 15000);

    const canReadUsers = this.authService.role() === 'ADMIN';

    forkJoin({
      resources: this.resourceService.getResources().pipe(timeout(10000), catchError(() => of([]))),
      users: (canReadUsers ? this.userService.getAll() : of([])).pipe(timeout(10000), catchError(() => of([])))
    }).subscribe({
      next: ({ resources, users }) => {
        const safeUsers = Array.isArray(users) ? users : [];
        const safeResources = Array.isArray(resources) ? resources : [];
        const userMap = new Map(safeUsers.map(u => [u.id, u.fullName]));
        this.resources.set(safeResources.map(r => ({
          id: String(r?.id ?? ''),
          title: r?.title ?? 'Untitled',
          type: r?.official ? 'official' : 'non-official',
          description: [r?.originalFilename, r?.fileType].filter(Boolean).join(' - ') || 'No file metadata',
          uploadedBy: userMap.get(r?.uploadedById) ?? 'Unknown',
          date: typeof r?.uploadedAt === 'string' ? r.uploadedAt.split('T')[0] : '-',
          classId: r?.classRoomId ? String(r.classRoomId) : undefined
        })));
        this.resourcesLoaded.set(true);
        this.resourcesLoading.set(false);
        clearTimeout(watchdog);
      },
      error: () => {
        this.resourcesError.set('Failed to load resources. Please try again.');
        this.resourcesLoading.set(false);
        clearTimeout(watchdog);
      }
    });
  }

  loadClassDetails(classId: number, force = false): void {
    if (!classId) return;
    const current = this.classDetails()[classId];
    if (current?.loading) return;
    if (current?.schoolClass && !force) return;

    this.classDetails.update(prev => ({
      ...prev,
      [classId]: { loading: true, error: '', schoolClass: undefined, students: [], resources: [] }
    }));

    const canReadUsers = this.authService.role() === 'ADMIN';

    forkJoin({
      classroom: this.classroomService.getById(classId).pipe(timeout(10000), catchError(() => of(null))),
      enrollments: this.enrollmentService.getByClass(classId).pipe(timeout(10000), catchError(() => of([]))),
      ownerships: this.ownershipService.getByClass(classId).pipe(timeout(10000), catchError(() => of([]))),
      students: this.studentService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      teachers: this.teacherService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      users: (canReadUsers ? this.userService.getAll() : of([])).pipe(timeout(10000), catchError(() => of([]))),
      resources: this.resourceService.getByClass(classId).pipe(timeout(10000), catchError(() => of([])))
    }).subscribe({
      next: ({ classroom, enrollments, ownerships, students, teachers, users, resources }) => {
        const fallbackClass = this.classes().find(c => Number(c.id) === classId);
        const safeClassroom = classroom ?? (fallbackClass ? {
          id: classId,
          name: fallbackClass.name,
          year: fallbackClass.year
        } : null);

        if (!safeClassroom) {
          this.classDetails.update(prev => ({
            ...prev,
            [classId]: { loading: false, error: 'Failed to load class details.', students: [], resources: [] }
          }));
          return;
        }

        const safeEnrollments = Array.isArray(enrollments) ? enrollments : [];
        const safeOwnerships = Array.isArray(ownerships) ? ownerships : [];
        const safeStudents = Array.isArray(students) ? students : [];
        const safeTeachers = Array.isArray(teachers) ? teachers : [];
        const safeUsers = Array.isArray(users) ? users : [];
        const safeResources = Array.isArray(resources) ? resources : [];

        const userMap = new Map(safeUsers.map(u => [u.id, u]));
        const studentMap = new Map(safeStudents.map(s => [s.id, s]));
        const teacherMap = new Map(safeTeachers.map(t => [t.id, t]));

        const teacherNames = safeOwnerships
          .map(o => teacherMap.get(o.teacherId))
          .filter((t): t is NonNullable<typeof t> => !!t)
          .map(t => userMap.get(t.userId)?.fullName ?? 'Teacher');

        const schoolClass: SchoolClass = {
          id: String(safeClassroom.id ?? ''),
          name: safeClassroom.name ?? 'Class',
          grade: `Year ${safeClassroom.year ?? '-'}`,
          studentsCount: safeEnrollments.length,
          teachers: teacherNames,
          resources: safeResources.map(r => r?.title ?? 'Resource')
        };

        const classStudents: Student[] = safeEnrollments
          .map(e => studentMap.get(e.studentId))
          .filter((s): s is NonNullable<typeof s> => !!s)
          .map(s => ({
            id: String(s.id ?? ''),
            name: userMap.get(s.userId)?.fullName ?? 'Student',
            email: userMap.get(s.userId)?.email ?? '-',
            classId: String(safeClassroom.id ?? '')
          }));

        const classResources: Resource[] = safeResources.map(r => ({
          id: String(r?.id ?? ''),
          title: r?.title ?? 'Untitled',
          type: r?.official ? 'official' : 'non-official',
          description: '',
          uploadedBy: userMap.get(r?.uploadedById)?.fullName ?? 'Unknown',
          date: typeof r?.uploadedAt === 'string' ? r.uploadedAt.split('T')[0] : '-',
          classId: r?.classRoomId ? String(r.classRoomId) : undefined
        }));

        this.classDetails.update(prev => ({
          ...prev,
          [classId]: {
            loading: false,
            error: '',
            schoolClass,
            students: classStudents,
            resources: classResources
          }
        }));
      },
      error: () => {
        this.classDetails.update(prev => ({
          ...prev,
          [classId]: { loading: false, error: 'Failed to load class details.', students: [], resources: [] }
        }));
      }
    });
  }

  loadDashboard(force = false): void {
    if (this.dashboardLoading()) return;
    if (this.dashboardLoaded() && !force) return;

    this.dashboardLoading.set(true);
    this.dashboardError.set('');

    forkJoin({
      classes: this.classroomService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      teachers: this.teacherService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      students: this.studentService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      resources: this.resourceService.getAll().pipe(timeout(10000), catchError(() => of([])))
    }).pipe(
      finalize(() => this.dashboardLoading.set(false))
    ).subscribe({
      next: ({ classes, teachers, students, resources }) => {
        const safeClasses = Array.isArray(classes) ? classes : [];
        const safeTeachers = Array.isArray(teachers) ? teachers : [];
        const safeStudents = Array.isArray(students) ? students : [];
        const safeResources = Array.isArray(resources) ? resources : [];

        this.dashboardStats.set([
          {
            label: 'Total Classes',
            value: safeClasses.length,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="w-11 h-11"><rect x="10" y="8" width="44" height="48" rx="6" fill="currentColor" opacity="0.15"/><path d="M20 22h24M20 30h20M20 38h16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="44" r="10" fill="currentColor" opacity="0.25"/><path d="M40 44l3 3 5-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
            color: '#2563eb'
          },
          {
            label: 'Teachers',
            value: safeTeachers.length,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="w-11 h-11"><circle cx="32" cy="20" r="12" fill="currentColor" opacity="0.2"/><path d="M12 56c0-8 8-16 20-16s20 8 20 16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="52" cy="12" r="8" fill="currentColor" opacity="0.3"/><path d="M48 14l3-3 4 3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            color: '#7c3aed'
          },
          {
            label: 'Students',
            value: safeStudents.length,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="w-11 h-11"><circle cx="20" cy="20" r="10" fill="currentColor" opacity="0.2"/><path d="M6 56c0-6 6-14 14-14s14 8 14 14" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="44" cy="20" r="10" fill="currentColor" opacity="0.2"/><path d="M30 56c0-6 6-14 14-14s14 8 14 14" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
            color: '#059669'
          },
          {
            label: 'Resources',
            value: safeResources.length,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="w-11 h-11"><rect x="8" y="4" width="48" height="56" rx="6" fill="currentColor" opacity="0.15"/><path d="M18 18h28M18 26h24M18 34h20M18 42h16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="40" y="46" width="12" height="10" rx="2" fill="currentColor" opacity="0.3"/></svg>`,
            color: '#d97706'
          }
        ]);
        this.dashboardLoaded.set(true);
      },
      error: () => {
        this.dashboardError.set('Failed to load dashboard data.');
      }
    });
  }

  loadAttendanceSetup(isAdmin: boolean, force = false): void {
    if (this.attendanceSetupLoading()) return;
    if (this.attendanceSetupLoaded() && !force) return;

    this.attendanceSetupLoading.set(true);
    this.attendanceSetupError.set('');

    const requests = {
      classes: (isAdmin ? this.classroomService.getAll() : this.getClassroomsForCurrentRole()).pipe(timeout(10000), catchError(() => of([]))),
      teachers: isAdmin ? this.teacherService.getAll().pipe(timeout(10000), catchError(() => of([]))) : of([]),
      users: isAdmin ? this.userService.getAll().pipe(timeout(10000), catchError(() => of([]))) : of([])
    };

    forkJoin(requests).pipe(
      finalize(() => this.attendanceSetupLoading.set(false))
    ).subscribe({
      next: ({ classes, teachers, users }) => {
        const classList = Array.isArray(classes) ? classes : [];
        this.attendanceClasses.set(classList.map(c => ({
          id: String(c?.id ?? ''),
          name: c?.name ?? 'Class',
          grade: `Year ${c?.year ?? '-'}`,
          studentsCount: 0,
          teachers: [],
          resources: []
        })));

        if (isAdmin) {
          const safeTeachers = Array.isArray(teachers) ? teachers : [];
          const safeUsers = Array.isArray(users) ? users : [];
          const userMap = new Map(safeUsers.map(u => [u.id, u]));
          this.attendanceTeacherOptions.set(safeTeachers.map(t => ({
            id: t.id,
            label: userMap.get(t.userId)?.fullName ?? `Teacher #${t.id}`
          })));
        } else {
          this.attendanceTeacherOptions.set([]);
        }

        this.attendanceSetupLoaded.set(true);
      },
      error: () => {
        this.attendanceSetupError.set('Failed to load attendance setup data.');
      }
    });
  }

  loadAttendanceRecords(classId: number, force = false): void {
    if (!classId) return;
    const current = this.attendanceRecords()[classId];
    if (current?.loading) return;
    if (current?.records.length && !force) return;

    this.attendanceRecords.update(prev => ({
      ...prev,
      [classId]: { loading: true, error: '', records: [] }
    }));

    const canReadUsers = this.authService.role() === 'ADMIN';

    forkJoin({
      enrollments: this.enrollmentService.getByClass(classId).pipe(timeout(10000), catchError(() => of([]))),
      students: this.studentService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      users: (canReadUsers ? this.userService.getAll() : of([])).pipe(timeout(10000), catchError(() => of([]))),
      records: this.attendanceRecordService.getByClass(classId).pipe(timeout(10000), catchError(() => of([])))
    }).subscribe({
      next: ({ enrollments, students, users, records }) => {
        const safeEnrollments = Array.isArray(enrollments) ? enrollments : [];
        const safeStudents = Array.isArray(students) ? students : [];
        const safeUsers = Array.isArray(users) ? users : [];
        const safeRecords = Array.isArray(records) ? records : [];

        const studentMap = new Map(safeStudents.map(s => [s.id, s]));
        const userMap = new Map(safeUsers.map(u => [u.id, u]));
        const recordByStudent = new Map(safeRecords.map(r => [r.studentId, r]));

        const mappedRecords: AttendanceRecord[] = safeEnrollments.map(enrollment => {
          const student = studentMap.get(enrollment.studentId);
          const user = student ? userMap.get(student.userId) : undefined;
          const existing = recordByStudent.get(enrollment.studentId);
          return {
            studentId: String(enrollment.studentId),
            studentName: user?.fullName ?? student?.studentCode ?? `Student #${enrollment.studentId}`,
            present: existing ? existing.status === 'PRESENT' : true,
            justified: existing?.justified ?? false,
            reason: existing?.reason ?? ''
          };
        });

        this.attendanceRecords.update(prev => ({
          ...prev,
          [classId]: { loading: false, error: '', records: mappedRecords }
        }));
      },
      error: () => {
        this.attendanceRecords.update(prev => ({
          ...prev,
          [classId]: { loading: false, error: 'Failed to load attendance records.', records: [] }
        }));
      }
    });
  }

  sendChatMessage(text: string, mode: ChatMode = 'DOCUMENTS'): void {
    const message = text.trim();
    if (!message || this.chatLoading()) return;

    this.chatError.set('');
    this.chatMessages.update(list => [...list, { role: 'user', content: message, mode, timestamp: new Date() }]);
    this.persistChatForCurrentUser();
    this.chatLoading.set(true);

    const watchdog = setTimeout(() => {
      if (this.chatLoading()) {
        this.chatLoading.set(false);
        this.chatError.set('Chat request timed out. Please try again.');
      }
    }, 20000);

    this.chatService.sendMessage(message, mode).pipe(
      timeout(15000),
      finalize(() => {
        this.chatLoading.set(false);
        clearTimeout(watchdog);
      })
    ).subscribe({
      next: res => {
        const answer = typeof res?.answer === 'string' ? res.answer : '';
        const sources = Array.isArray(res?.sources) ? res.sources : [];
        const lowerAnswer = answer.toLowerCase();
        this.chatFallbackBanner.set(this.CHAT_FALLBACK_PHRASES.some(p => lowerAnswer.includes(p)));
        this.chatMessages.update(list => [
          ...list,
          {
            role: 'assistant',
            content: answer || 'No answer returned by server.',
            mode,
            sources,
            citation: `"sources": ${JSON.stringify(sources)}`,
            timestamp: new Date()
          }
        ]);
        this.persistChatForCurrentUser();
      },
      error: err => {
        const status = typeof err?.status === 'number' ? err.status : 0;
        const messageText = (typeof err?.error === 'object' && err?.error?.message)
          ? err.error.message
          : (err?.message || 'Unknown error');
        this.chatError.set(`Chat request failed (${status}): ${messageText}`);
      }
    });
  }

  clearChat(): void {
    this.chatMessages.set([]);
    this.chatError.set('');
    this.chatFallbackBanner.set(false);
    this.chatLoading.set(false);
    this.persistChatForCurrentUser();
  }

  private chatStorageKey(): string | null {
    const userId = this.authService.userId();
    if (!userId) return null;
    return `${ViewStateService.CHAT_STORAGE_PREFIX}${userId}`;
  }

  private persistChatForCurrentUser(): void {
    const key = this.chatStorageKey();
    if (!key) return;

    try {
      localStorage.setItem(key, JSON.stringify(this.chatMessages()));
    } catch {
    }
  }

  private getClassroomsForCurrentRole(): Observable<any[]> {
    const role = this.authService.role();
    const authStudentIdRaw = this.authService.studentId();
    const authStudentId = Number(authStudentIdRaw);
    if (role === 'ADMIN') {
      return this.classroomService.getAll().pipe(catchError(() => of([])));
    }
    if (Number.isFinite(authStudentId) && authStudentId > 0) {
      return forkJoin({
        enrollments: this.enrollmentService.getByStudent(authStudentId).pipe(catchError(() => of([]))),
        classes: this.classroomService.getAll().pipe(catchError(() => of([])))
      }).pipe(
        map(({ enrollments, classes }) => {
          const enrolledClassIds = new Set(
            (Array.isArray(enrollments) ? enrollments : [])
              .filter(e => e?.status !== 'ENDED')
              .map(e => e.classRoomId)
          );
          return (Array.isArray(classes) ? classes : []).filter(c => enrolledClassIds.has(c.id));
        })
      );
    }

    if (role !== 'TEACHER' && role !== 'STUDENT') {
      return this.classroomService.getAll().pipe(catchError(() => of([])));
    }

    if (role === 'STUDENT') {
      return this.resolveCurrentStudentId().pipe(
        switchMap(studentId => {
          if (!studentId) {
            this.classesError.set('Student profile not found for current account.');
            return of([]);
          }

          return forkJoin({
            enrollments: this.enrollmentService.getByStudent(studentId).pipe(catchError(() => of([]))),
            classes: this.classroomService.getAll().pipe(catchError(() => of([])))
          }).pipe(
            map(({ enrollments, classes }) => {
              const enrolledClassIds = new Set(
                (Array.isArray(enrollments) ? enrollments : [])
                  .filter(e => e?.status !== 'ENDED')
                  .map(e => e.classRoomId)
              );
              return (Array.isArray(classes) ? classes : []).filter(c => enrolledClassIds.has(c.id));
            })
          );
        })
      );
    }

    return this.resolveCurrentTeacherId().pipe(
      switchMap(teacherId => {
        if (!teacherId) {
          this.classesError.set('Teacher profile not found for current account.');
          return of([]);
        }

        return this.classroomService.getAll().pipe(
          catchError(() => of([])),
          switchMap(classes => {
            const safeClasses = Array.isArray(classes) ? classes : [];
            if (!safeClasses.length) {
              return of([]);
            }

            return forkJoin(
              safeClasses.map(cls =>
                this.ownershipService.getByClass(cls.id).pipe(
                  catchError(() => of([])),
                  map(ownerships => ({ cls, ownerships: Array.isArray(ownerships) ? ownerships : [] }))
                )
              )
            ).pipe(
              map(items =>
                items
                  .filter(item => item.ownerships.some(o => o.teacherId === teacherId && o.status !== 'ENDED'))
                  .map(item => item.cls)
              )
            );
          })
        );
      })
    );
  }

  private resolveCurrentTeacherId(): Observable<number | null> {
    const fromAuth = this.authService.teacherId();
    if (typeof fromAuth === 'number' && fromAuth > 0) {
      return of(fromAuth);
    }

    const currentUserId = this.authService.userId();
    if (!currentUserId) {
      return of(null);
    }

    return this.teacherService.getAll().pipe(
      map(teachers => {
        const list = Array.isArray(teachers) ? teachers : [];
        const teacher = list.find(t => t.userId === currentUserId);
        return teacher?.id ?? null;
      }),
      catchError(() => of(null))
    );
  }

  private resolveCurrentStudentId(): Observable<number | null> {
    const fromAuth = this.authService.studentId();
    if (typeof fromAuth === 'number' && fromAuth > 0) {
      return of(fromAuth);
    }

    const currentUserId = this.authService.userId();
    if (!currentUserId) {
      return of(null);
    }

    return this.studentService.getAll().pipe(
      map(students => {
        const list = Array.isArray(students) ? students : [];
        const student = list.find(s => s.userId === currentUserId);
        return student?.id ?? null;
      }),
      catchError(() => of(null))
    );
  }

  loadUsers(force = false): void {
    if (this.usersLoading()) return;
    if (this.usersLoaded() && !force) return;

    this.usersLoading.set(true);
    this.usersError.set('');

    this.userService.getAll().pipe(
      timeout(10000),
      finalize(() => this.usersLoading.set(false)),
      catchError(() => {
        this.usersError.set('Failed to load users.');
        return of([]);
      })
    ).subscribe(users => {
      this.users.set(Array.isArray(users) ? users : []);
      this.usersLoaded.set(true);
    });
  }

  loadEnrollmentsSetup(force = false): void {
    if (this.enrollmentsSetup().loading) return;
    if (this.enrollmentsSetup().classes.length && !force) return;

    this.enrollmentsSetup.update(s => ({ ...s, loading: true, error: '' }));

    forkJoin({
      classes: this.classroomService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      students: this.studentService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      users: this.userService.getAll().pipe(timeout(10000), catchError(() => of([])))
    }).pipe(
      finalize(() => this.enrollmentsSetup.update(s => ({ ...s, loading: false })))
    ).subscribe({
      next: ({ classes, students, users }) => {
        const safeStudents = Array.isArray(students) ? students : [];
        const safeUsers = Array.isArray(users) ? users : [];
        const userMap = new Map(safeUsers.map(u => [u.id, u]));
        const enrichedStudents = safeStudents.map(s => ({
          ...s,
          fullName: userMap.get(s.userId)?.fullName ?? `Student #${s.id}`,
          email: userMap.get(s.userId)?.email ?? ''
        }));
        this.enrollmentsSetup.update(s => ({
          ...s,
          classes: Array.isArray(classes) ? classes : [],
          students: enrichedStudents
        }));
      },
      error: () => {
        this.enrollmentsSetup.update(s => ({ ...s, error: 'Failed to load enroll setup.' }));
      }
    });
  }

  loadClassEnrollments(classId: number, force = false): void {
    if (!classId) return;
    const current = this.enrollmentsByClass()[classId];
    if (current?.loading) return;
    if (current?.enrollments.length && !force) return;

    this.enrollmentsByClass.update(prev => ({
      ...prev,
      [classId]: { loading: true, error: '', enrollments: [] }
    }));

    this.enrollmentService.getByClass(classId).pipe(
      timeout(10000),
      catchError(() => {
        this.enrollmentsByClass.update(prev => ({
          ...prev,
          [classId]: { loading: false, error: 'Failed to load enrollments.', enrollments: [] }
        }));
        return of([]);
      })
    ).subscribe(enrollments => {
      this.enrollmentsByClass.update(prev => ({
        ...prev,
        [classId]: {
          loading: false,
          error: '',
          enrollments: Array.isArray(enrollments) ? enrollments : []
        }
      }));
    });
  }

  loadOwnershipsSetup(force = false): void {
    if (this.ownershipsSetup().loading) return;
    if (this.ownershipsSetup().classes.length && !force) return;

    this.ownershipsSetup.update(s => ({ ...s, loading: true, error: '' }));

    forkJoin({
      classes: this.classroomService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      teachers: this.teacherService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      users: this.userService.getAll().pipe(timeout(10000), catchError(() => of([])))
    }).pipe(
      finalize(() => this.ownershipsSetup.update(s => ({ ...s, loading: false })))
    ).subscribe({
      next: ({ classes, teachers, users }) => {
        const safeTeachers = Array.isArray(teachers) ? teachers : [];
        const safeUsers = Array.isArray(users) ? users : [];
        const userMap = new Map(safeUsers.map(u => [u.id, u]));
        const enrichedTeachers = safeTeachers.map(t => ({
          ...t,
          fullName: userMap.get(t.userId)?.fullName ?? `Teacher #${t.id}`,
          email: userMap.get(t.userId)?.email ?? ''
        }));
        this.ownershipsSetup.update(s => ({
          ...s,
          classes: Array.isArray(classes) ? classes : [],
          teachers: enrichedTeachers
        }));
      },
      error: () => {
        this.ownershipsSetup.update(s => ({ ...s, error: 'Failed to load ownership setup.' }));
      }
    });
  }

  loadClassOwnerships(classId: number, force = false): void {
    if (!classId) return;
    const current = this.ownershipsByClass()[classId];
    if (current?.loading) return;
    if (current?.ownerships.length && !force) return;

    this.ownershipsByClass.update(prev => ({
      ...prev,
      [classId]: { loading: true, error: '', ownerships: [] }
    }));

    this.ownershipService.getByClass(classId).pipe(
      timeout(10000),
      catchError(() => {
        this.ownershipsByClass.update(prev => ({
          ...prev,
          [classId]: { loading: false, error: 'Failed to load ownerships.', ownerships: [] }
        }));
        return of([]);
      })
    ).subscribe(ownerships => {
      this.ownershipsByClass.update(prev => ({
        ...prev,
        [classId]: {
          loading: false,
          error: '',
          ownerships: Array.isArray(ownerships) ? ownerships : []
        }
      }));
    });
  }
}
