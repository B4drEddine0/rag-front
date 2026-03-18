import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttendanceRecordDTO } from '../../shared/models/attendance-api.model';

const BASE = 'http://localhost:8080/api/attendance/records';

@Injectable({ providedIn: 'root' })
export class AttendanceRecordService {
  private readonly http = inject(HttpClient);

  create(dto: Omit<AttendanceRecordDTO, 'id'>): Observable<AttendanceRecordDTO> {
    return this.http.post<AttendanceRecordDTO>(BASE, dto);
  }

  getByClass(classRoomId: number): Observable<AttendanceRecordDTO[]> {
    return this.http.get<AttendanceRecordDTO[]>(`${BASE}/class/${classRoomId}`);
  }

  getByStudent(studentId: number): Observable<AttendanceRecordDTO[]> {
    return this.http.get<AttendanceRecordDTO[]>(`${BASE}/student/${studentId}`);
  }
}
