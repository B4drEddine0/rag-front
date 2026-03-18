import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClassRoomDTO } from '../../shared/models/classroom.model';

const BASE = 'http://localhost:8080/api/classes';

@Injectable({ providedIn: 'root' })
export class ClassroomService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<ClassRoomDTO[]> {
    return this.http.get<ClassRoomDTO[]>(BASE);
  }

  getById(id: number): Observable<ClassRoomDTO> {
    return this.http.get<ClassRoomDTO>(`${BASE}/${id}`);
  }

  create(dto: Omit<ClassRoomDTO, 'id'>): Observable<ClassRoomDTO> {
    return this.http.post<ClassRoomDTO>(BASE, dto);
  }

  update(id: number, dto: Partial<ClassRoomDTO>): Observable<ClassRoomDTO> {
    return this.http.put<ClassRoomDTO>(`${BASE}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
