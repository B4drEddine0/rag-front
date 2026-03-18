import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
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
  private readonly classroomService = inject(ClassroomService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly ownershipService = inject(OwnershipService);
  private readonly resourceService = inject(ResourceService);
  private readonly studentService = inject(StudentService);
  private readonly teacherService = inject(TeacherService);
  private readonly userService = inject(UserService);
  private readonly attendanceRecordService = inject(AttendanceRecordService);
  private readonly chatService = inject(ChatService);

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

    this.classroomService.getAll().pipe(
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

    forkJoin({
      resources: this.resourceService.getResources().pipe(timeout(10000), catchError(() => of([]))),
      users: this.userService.getAll().pipe(timeout(10000), catchError(() => of([])))
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

    forkJoin({
      classroom: this.classroomService.getById(classId).pipe(timeout(10000), catchError(() => of(null))),
      enrollments: this.enrollmentService.getByClass(classId).pipe(timeout(10000), catchError(() => of([]))),
      ownerships: this.ownershipService.getByClass(classId).pipe(timeout(10000), catchError(() => of([]))),
      students: this.studentService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      teachers: this.teacherService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      users: this.userService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      resources: this.resourceService.getByClass(classId).pipe(timeout(10000), catchError(() => of([])))
    }).subscribe({
      next: ({ classroom, enrollments, ownerships, students, teachers, users, resources }) => {
        if (!classroom) {
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
          id: String(classroom.id ?? ''),
          name: classroom.name ?? 'Class',
          grade: `Year ${classroom.year ?? '-'}`,
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
            classId: String(classroom.id ?? '')
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
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>`,
            color: '#2563eb'
          },
          {
            label: 'Teachers',
            value: safeTeachers.length,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>`,
            color: '#7c3aed'
          },
          {
            label: 'Students',
            value: safeStudents.length,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/></svg>`,
            color: '#059669'
          },
          {
            label: 'Resources',
            value: safeResources.length,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>`,
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
      classes: this.classroomService.getAll().pipe(timeout(10000), catchError(() => of([]))),
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

    forkJoin({
      enrollments: this.enrollmentService.getByClass(classId).pipe(timeout(10000), catchError(() => of([]))),
      students: this.studentService.getAll().pipe(timeout(10000), catchError(() => of([]))),
      users: this.userService.getAll().pipe(timeout(10000), catchError(() => of([]))),
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
            studentName: user?.fullName ?? 'Student',
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
