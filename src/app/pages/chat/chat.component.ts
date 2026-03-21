import { Component, effect, ElementRef, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ViewStateService } from '../../core/services/view-state.service';
import { ChatMode } from '../../shared/models/chat-api.model';
import { ChatMessage } from '../../shared/models/chat.model';
import { ChatBubbleComponent } from '../../components/chat-bubble/chat-bubble.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, ChatBubbleComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  private readonly viewState = inject(ViewStateService);

  @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;

  readonly modes: Array<{ label: string; value: ChatMode }> = [
    { label: 'General AI', value: 'GENERAL_AI' },
    { label: 'Documents', value: 'DOCUMENTS' },
    { label: 'Statistics', value: 'STATS' }
  ];

  readonly quickPrompts: Array<{ mode: ChatMode; prompt: string }> = [
    { mode: 'DOCUMENTS', prompt: 'Summarize the uploaded CV' },
    { mode: 'STATS', prompt: 'How many students were absent today?' },
    { mode: 'GENERAL_AI', prompt: 'Explain Java streams simply' }
  ];

  userInput = '';
  selectedMode: ChatMode = 'DOCUMENTS';

  get messages(): ChatMessage[] {
    return this.viewState.chatMessages();
  }

  get loading(): boolean {
    return this.viewState.chatLoading();
  }

  get error(): string {
    return this.viewState.chatError();
  }

  get showFallbackBanner(): boolean {
    return this.viewState.chatFallbackBanner();
  }

  private readonly syncScroll = effect(() => {
    const messageCount = this.viewState.chatMessages().length;
    if (messageCount > 0) {
      setTimeout(() => this.scrollToBottom(), 50);
    }
  });

  send(): void {
    const text = this.userInput.trim();
    if (!text || this.loading) return;
    this.userInput = '';
    this.viewState.sendChatMessage(text, this.selectedMode);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  quickAsk(mode: ChatMode, question: string): void {
    this.selectedMode = mode;
    this.userInput = question;
    this.send();
  }

  clearChat(): void {
    this.viewState.clearChat();
  }

  dismissFallbackBanner(): void {
    this.viewState.chatFallbackBanner.set(false);
  }

  modeLabel(mode: ChatMode): string {
    if (mode === 'GENERAL_AI') return 'General AI';
    if (mode === 'DOCUMENTS') return 'Documents';
    return 'Statistics';
  }

  private scrollToBottom(): void {
    const el = this.chatContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
