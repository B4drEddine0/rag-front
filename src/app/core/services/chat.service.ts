import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMode, ChatRequest, ChatResponse } from '../../shared/models/chat-api.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/api/chat';

  sendMessage(message: string, mode: ChatMode): Observable<ChatResponse> {
    const request: ChatRequest = { message, mode };
    return this.http.post<ChatResponse>(this.base, request);
  }
}
