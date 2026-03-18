export type OwnershipStatus = 'ACTIVE' | 'ENDED';

export interface ClassOwnershipDTO {
  id: number;
  teacherId: number;
  classRoomId: number;
  assignedAt: string;
  status: OwnershipStatus;
  primary: boolean;
}
