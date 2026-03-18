import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClassOwnershipDTO } from '../../shared/models/ownership.model';

const BASE = 'http://localhost:8080/api/ownerships';

@Injectable({ providedIn: 'root' })
export class OwnershipService {
  private readonly http = inject(HttpClient);

  create(dto: {
    teacherId: number;
    classId?: number;
    classRoomId?: number;
    assignedAt: string;
    status: 'ACTIVE' | 'ENDED';
    primary?: boolean;
  }): Observable<ClassOwnershipDTO> {
    return this.http.post<ClassOwnershipDTO>(BASE, dto);
  }

  getByClass(classRoomId: number): Observable<ClassOwnershipDTO[]> {
    return this.http.get<ClassOwnershipDTO[]>(`${BASE}/class/${classRoomId}`);
  }

  end(id: number): Observable<ClassOwnershipDTO> {
    return this.http.put<ClassOwnershipDTO>(`${BASE}/${id}/end`, {});
  }
}
