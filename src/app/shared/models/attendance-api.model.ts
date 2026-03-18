export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export interface AttendanceSessionDTO {
  id: number;
  classRoomId: number;
  teacherId: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
}

export interface AttendanceRecordDTO {
  id: number;
  attendanceSessionId: number;
  studentId: number;
  status: AttendanceStatus;
  justified: boolean;
  reason?: string;
}
