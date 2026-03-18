export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  present: boolean;
  justified: boolean;
  reason: string;
}

export interface AttendanceSession {
  classId: string;
  date: string;
  records: AttendanceRecord[];
}
