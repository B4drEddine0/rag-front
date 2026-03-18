import { ChatMode } from './chat-api.model';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citation?: string;
  sources?: string[];
  mode?: ChatMode;
  timestamp: Date;
}
