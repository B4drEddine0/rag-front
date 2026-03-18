import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from '../../shared/models/user.model';

const BASE = 'http://localhost:8080/api/users';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(BASE);
  }

  getById(id: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${BASE}/${id}`);
  }

  create(dto: Omit<UserDTO, 'id'>): Observable<UserDTO> {
    return this.http.post<UserDTO>(BASE, dto);
  }

  update(id: number, dto: Omit<UserDTO, 'id'>): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${BASE}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
