import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnrollmentDTO } from '../../shared/models/enrollment.model';

const BASE = 'http://localhost:8080/api/enrollments';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly http = inject(HttpClient);

  create(dto: {
    studentId: number;
    classId?: number;
    classRoomId?: number;
    enrolledAt: string;
    status: 'ACTIVE' | 'ENDED';
  }): Observable<EnrollmentDTO> {
    return this.http.post<EnrollmentDTO>(BASE, dto);
  }

  getByStudent(studentId: number): Observable<EnrollmentDTO[]> {
    return this.http.get<EnrollmentDTO[]>(`${BASE}/student/${studentId}`);
  }

  getByClass(classRoomId: number): Observable<EnrollmentDTO[]> {
    return this.http.get<EnrollmentDTO[]>(`${BASE}/class/${classRoomId}`);
  }

  end(id: number): Observable<EnrollmentDTO> {
    return this.http.put<EnrollmentDTO>(`${BASE}/${id}/end`, {});
  }
}
