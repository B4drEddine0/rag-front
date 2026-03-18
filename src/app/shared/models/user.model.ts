import { ApiRole } from './auth.model';

export interface UserDTO {
  id: number;
  fullName: string;
  email: string;
  password?: string;
  role: ApiRole;
}
