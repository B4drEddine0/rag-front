import { Component, Input } from '@angular/core';
import { ChatMode } from '../../shared/models/chat-api.model';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  templateUrl: './chat-bubble.component.html',
  styleUrl: './chat-bubble.component.css'
})
export class ChatBubbleComponent {
  @Input() role: 'user' | 'assistant' = 'user';
  @Input() content = '';
  @Input() citation?: string;
  @Input() sources?: string[];
  @Input() mode?: ChatMode;

  modeLabel(mode?: ChatMode): string {
    if (mode === 'GENERAL_AI') return 'General AI';
    if (mode === 'DOCUMENTS') return 'Documents';
    if (mode === 'STATS') return 'Statistics';
    return '';
  }
}
