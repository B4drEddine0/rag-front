import { Injectable } from '@angular/core';
import { SchoolClass, Student } from '../../shared/models/class.model';

@Injectable({ providedIn: 'root' })
export class ClassService {
  private readonly classes: SchoolClass[] = [
    {
      id: 'cls-1',
      name: 'Class A',
      grade: '10th Grade',
      studentsCount: 28,
      teachers: ['Mr. Ahmed', 'Ms. Fatima'],
      resources: ['res-1']
    }
  ];

  private readonly students: Student[] = [
    { id: 'stu-1', name: 'Amine Benali', email: 'amine@school.io', classId: 'cls-1' },
    { id: 'stu-2', name: 'Yasmine Khelil', email: 'yasmine@school.io', classId: 'cls-1' },
    { id: 'stu-3', name: 'Omar Tazi', email: 'omar@school.io', classId: 'cls-1' }
  ];

  getClasses(): SchoolClass[] {
    return this.classes;
  }

  getClassById(id: string): SchoolClass | undefined {
    return this.classes.find(c => c.id === id);
  }

  getStudentsByClass(classId: string): Student[] {
    return this.students.filter(s => s.classId === classId);
  }
}
