export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: string; // ISO
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
}

export interface AskResponse {
  success: boolean;
  data: {
    response: string;
    conversationId: number;
    timestamp: string;
  };
}
