import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResourceDto, ResourceDetailsDto } from '../../shared/models/resource-api.model';

const BASE = 'http://localhost:8080/api/resources';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly http = inject(HttpClient);

  uploadResourceFile(
    file: File,
    title: string,
    classRoomId?: number,
    isOfficial = false
  ): Observable<ResourceDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (classRoomId) {
      formData.append('classRoomId', String(classRoomId));
    }
    formData.append('isOfficial', String(isOfficial));
    return this.http.post<ResourceDto>(`${BASE}/upload`, formData);
  }

  getResources(): Observable<ResourceDto[]> {
    return this.http.get<ResourceDto[]>(BASE);
  }

  getByClass(classRoomId: number): Observable<ResourceDto[]> {
    return this.http.get<ResourceDto[]>(`${BASE}/class/${classRoomId}`);
  }

  getResourceDetails(id: number): Observable<ResourceDetailsDto> {
    return this.http.get<ResourceDetailsDto>(`${BASE}/${id}/details`);
  }

  getResourceFileBlob(id: number) {
    return this.http.get(`${BASE}/${id}/file`, {
      observe: 'response',
      responseType: 'blob'
    });
  }
  getAll(): Observable<ResourceDto[]> {
    return this.getResources();
  }

  getDetails(id: number): Observable<ResourceDetailsDto> {
    return this.getResourceDetails(id);
  }

  getFile(id: number) {
    return this.getResourceFileBlob(id);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
