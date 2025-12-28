import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
}

interface RagState {
  conversations: Conversation[];
  selectedId: number | null;
  messagesByConv: Record<number, ChatMessage[]>;
  loadingConversations: boolean;
  loadingHistory: boolean;
  sending: boolean;
  error?: string | null;
}

const initialState: RagState = {
  conversations: [],
  selectedId: null,
  messagesByConv: {},
  loadingConversations: false,
  loadingHistory: false,
  sending: false,
  error: null,
};

export const ragSlice = createSlice({
  name: "rag",
  initialState,
  reducers: {
    // UI reducers
    selectConversation(state, action: PayloadAction<number>) {
      state.selectedId = action.payload;
      state.error = null;
    },
    pushUserMessage(
      state,
      action: PayloadAction<{ conversationId: number; message: ChatMessage }>
    ) {
      const convId = action.payload.conversationId;
      const msg = action.payload.message;
      state.messagesByConv[convId] = state.messagesByConv[convId]
        ? [...state.messagesByConv[convId], msg]
        : [msg];
    },
    resetMessagesFor(state, action: PayloadAction<number>) {
      state.messagesByConv[action.payload] = [];
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    updateConversationTitleAction(state, action: PayloadAction<{ conversationId: number; title: string }>) {
      const conversation = state.conversations.find(conv => conv.id === action.payload.conversationId);
      if (conversation) {
        conversation.title = action.payload.title;
      }
    },

    // Fetch conversations
    fetchConversationsStart(state) {
      state.loadingConversations = true;
      state.error = null;
    },
    fetchConversationsSuccess(state, action: PayloadAction<Conversation[]>) {
      state.loadingConversations = false;
      state.conversations = action.payload;
      if (!state.selectedId && action.payload.length > 0) {
        state.selectedId = action.payload[0].id;
      }
    },
    fetchConversationsFailure(state, action: PayloadAction<string>) {
      state.loadingConversations = false;
      state.error = action.payload;
    },

    // History
    fetchHistoryStart(state) {
      state.loadingHistory = true;
      state.error = null;
    },
    fetchHistorySuccess(
      state,
      action: PayloadAction<{ conversationId: number; messages: ChatMessage[] }>
    ) {
      state.loadingHistory = false;
      state.messagesByConv[action.payload.conversationId] = action.payload.messages;
    },
    fetchHistoryFailure(state, action: PayloadAction<string>) {
      state.loadingHistory = false;
      state.error = action.payload;
    },

    // Create conversation
    createConversationSuccess(state, action: PayloadAction<Conversation>) {
      state.conversations = [action.payload, ...state.conversations];
      state.selectedId = action.payload.id;
      state.messagesByConv[action.payload.id] = [];
    },
    createConversationFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },

    // Send message
    sendMessageStart(state) {
      state.sending = true;
      state.error = null;
    },
    sendMessageSuccess(
      state,
      action: PayloadAction<{ conversationId: number; assistant: ChatMessage }>
    ) {
      state.sending = false;
      const convId = action.payload.conversationId;
      const arr = state.messagesByConv[convId] || [];
      state.messagesByConv[convId] = [...arr, action.payload.assistant];
    },
    sendMessageFailure(state, action: PayloadAction<string>) {
      state.sending = false;
      state.error = action.payload;
    },
  },
});

export const {
  selectConversation,
  pushUserMessage,
  resetMessagesFor,
  setError,
  updateConversationTitleAction,
  fetchConversationsStart,
  fetchConversationsSuccess,
  fetchConversationsFailure,
  fetchHistoryStart,
  fetchHistorySuccess,
  fetchHistoryFailure,
  createConversationSuccess,
  createConversationFailure,
  sendMessageStart,
  sendMessageSuccess,
  sendMessageFailure,
} = ragSlice.actions;

export default ragSlice.reducer;

// Selectors
export const selectRag = (s: RootState) => s.rag;
export const selectSelectedMessages = (s: RootState) => {
  const id = s.rag.selectedId;
  return id ? s.rag.messagesByConv[id] || [] : [];
};

