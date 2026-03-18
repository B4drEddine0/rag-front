import { Injectable } from '@angular/core';
import { AttendanceRecord, AttendanceSession } from '../../shared/models/attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private sessions: AttendanceSession[] = [];

  getAttendanceForClass(classId: string): AttendanceRecord[] {
    const studentNames: Record<string, string[]> = {
      'cls-1': ['Amine Benali', 'Yasmine Khelil', 'Omar Tazi']
    };
    const names = studentNames[classId] || ['Student 1'];
    return names.map((name, i) => ({
      studentId: `stu-${i + 1}`,
      studentName: name,
      present: true,
      justified: false,
      reason: ''
    }));
  }

  saveAttendance(session: AttendanceSession): void {
    const idx = this.sessions.findIndex(
      s => s.classId === session.classId && s.date === session.date
    );
    if (idx >= 0) {
      this.sessions[idx] = session;
    } else {
      this.sessions.push(session);
    }
  }

  getAbsentsToday(): number {
    return 3;
  }

  getAbsenceRateThisMonth(): number {
    return 8.5;
  }
}
