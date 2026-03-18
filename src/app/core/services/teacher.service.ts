import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TeacherDTO } from '../../shared/models/teacher.model';

const BASE = 'http://localhost:8080/api/teachers';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<TeacherDTO[]> {
    return this.http.get<TeacherDTO[]>(BASE);
  }

  getById(id: number): Observable<TeacherDTO> {
    return this.http.get<TeacherDTO>(`${BASE}/${id}`);
  }

  create(dto: Omit<TeacherDTO, 'id'>): Observable<TeacherDTO> {
    return this.http.post<TeacherDTO>(BASE, dto);
  }

  update(id: number, dto: Partial<TeacherDTO>): Observable<TeacherDTO> {
    return this.http.put<TeacherDTO>(`${BASE}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
