export interface SchoolClass {
  id: string;
  name: string;
  grade: string;
  year?: number;
  studentsCount: number;
  teachers: string[];
  resources: string[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
}
