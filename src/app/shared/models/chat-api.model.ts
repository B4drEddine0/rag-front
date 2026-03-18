export type ChatMode = 'GENERAL_AI' | 'DOCUMENTS' | 'STATS';

export interface ChatRequest {
  message: string;
  mode: ChatMode;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
}
