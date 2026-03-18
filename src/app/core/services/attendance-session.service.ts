import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttendanceSessionDTO } from '../../shared/models/attendance-api.model';

const BASE = 'http://localhost:8080/api/attendance/sessions';

@Injectable({ providedIn: 'root' })
export class AttendanceSessionService {
  private readonly http = inject(HttpClient);

  create(dto: Omit<AttendanceSessionDTO, 'id'>): Observable<AttendanceSessionDTO> {
    return this.http.post<AttendanceSessionDTO>(BASE, dto);
  }

  getByClass(classRoomId: number): Observable<AttendanceSessionDTO[]> {
    return this.http.get<AttendanceSessionDTO[]>(`${BASE}/class/${classRoomId}`);
  }

  getById(id: number): Observable<AttendanceSessionDTO> {
    return this.http.get<AttendanceSessionDTO>(`${BASE}/${id}`);
  }
}
