import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentDTO } from '../../shared/models/student.model';

const BASE = 'http://localhost:8080/api/students';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<StudentDTO[]> {
    return this.http.get<StudentDTO[]>(BASE);
  }

  getById(id: number): Observable<StudentDTO> {
    return this.http.get<StudentDTO>(`${BASE}/${id}`);
  }

  create(dto: Omit<StudentDTO, 'id'>): Observable<StudentDTO> {
    return this.http.post<StudentDTO>(BASE, dto);
  }

  update(id: number, dto: Partial<StudentDTO>): Observable<StudentDTO> {
    return this.http.put<StudentDTO>(`${BASE}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
