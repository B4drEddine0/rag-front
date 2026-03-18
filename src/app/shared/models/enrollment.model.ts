export type EnrollmentStatus = 'ACTIVE' | 'ENDED';

export interface EnrollmentDTO {
  id: number;
  studentId: number;
  classRoomId: number;
  enrolledAt: string;
  status: EnrollmentStatus;
}
