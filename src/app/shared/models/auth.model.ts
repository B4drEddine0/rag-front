export type ApiRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: ApiRole;
}

export interface AuthResponse {
  token: string;
  userId: number;
  teacherId?: number;
  studentId?: number;
  fullName: string;
  email: string;
  role: ApiRole;
}
