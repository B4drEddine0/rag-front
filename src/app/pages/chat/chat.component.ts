import { Component, effect, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ViewStateService } from '../../core/services/view-state.service';
import { AuthService } from '../../core/services/auth.service';
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
export class ChatComponent implements OnInit {
  private static readonly CHAT_MODE_STORAGE_PREFIX = 'chat_mode_user_';

  private readonly viewState = inject(ViewStateService);
  private readonly authService = inject(AuthService);

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

  get isStudent(): boolean {
    return this.authService.role() === 'STUDENT';
  }

  get availableModes(): Array<{ label: string; value: ChatMode }> {
    if (!this.isStudent) return this.modes;
    return this.modes.filter(m => m.value !== 'STATS');
  }

  get availableQuickPrompts(): Array<{ mode: ChatMode; prompt: string }> {
    if (!this.isStudent) return this.quickPrompts;
    return this.quickPrompts.filter(p => p.mode !== 'STATS');
  }

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

  ngOnInit(): void {
    this.viewState.hydrateChatForCurrentUser();
    this.hydrateModeForCurrentUser();
    if (this.isStudent && this.selectedMode === 'STATS') {
      this.setMode('DOCUMENTS');
    }
  }

  send(): void {
    const text = this.userInput.trim();
    if (!text || this.loading) return;
    if (this.isStudent && this.selectedMode === 'STATS') {
      this.setMode('DOCUMENTS');
    }
    this.userInput = '';
    this.viewState.sendChatMessage(text, this.selectedMode);
  }

  onModeChange(mode: ChatMode): void {
    const safeMode = this.isStudent && mode === 'STATS' ? 'DOCUMENTS' : mode;
    this.setMode(safeMode);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  quickAsk(mode: ChatMode, question: string): void {
    this.setMode(this.isStudent && mode === 'STATS' ? 'DOCUMENTS' : mode);
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

  private setMode(mode: ChatMode): void {
    this.selectedMode = mode;
    this.persistModeForCurrentUser(mode);
  }

  private modeStorageKey(): string | null {
    const userId = this.authService.userId();
    if (!userId) return null;
    return `${ChatComponent.CHAT_MODE_STORAGE_PREFIX}${userId}`;
  }

  private hydrateModeForCurrentUser(): void {
    const key = this.modeStorageKey();
    if (!key) return;

    try {
      const rawMode = localStorage.getItem(key);
      if (!rawMode) return;
      if (this.modes.some(m => m.value === rawMode)) {
        this.selectedMode = rawMode as ChatMode;
      }
    } catch {
    }
  }

  private persistModeForCurrentUser(mode: ChatMode): void {
    const key = this.modeStorageKey();
    if (!key) return;

    try {
      localStorage.setItem(key, mode);
    } catch {
    }
  }
}
