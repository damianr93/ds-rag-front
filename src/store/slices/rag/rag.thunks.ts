import { nanoid } from "@reduxjs/toolkit";
import { apiFetch } from "../../../shared/utils/api";
import type { AppDispatch } from "../../store";
import {
  createConversationFailure,
  createConversationSuccess,
  fetchConversationsFailure,
  fetchConversationsStart,
  fetchConversationsSuccess,
  fetchHistoryFailure,
  fetchHistoryStart,
  fetchHistorySuccess,
  pushUserMessage,
  sendMessageFailure,
  sendMessageStart,
  sendMessageSuccess,
  updateConversationTitleAction,
  type ChatMessage,
  type Conversation,
} from "./ragSlice";

export const fetchConversations = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(fetchConversationsStart());
    const res = await apiFetch<{
      success: boolean;
      data: { userId: number; conversations: Conversation[] };
    }>("/api/AI/me/conversations", { auth: true });
    dispatch(fetchConversationsSuccess(res.data.conversations));
    return res.data.conversations;
  } catch (e: any) {
    dispatch(
      fetchConversationsFailure(e?.message || "Error cargando conversaciones")
    );
    throw e;
  }
};

export const fetchHistory = (conversationId: number) => async (dispatch: AppDispatch) => {
  try {
    dispatch(fetchHistoryStart());
    const res = await apiFetch<{
      success: boolean;
      data: {
        conversationId: number;
        messages: { role: "user" | "assistant"; content: string; timestamp: string }[];
        totalMessages: number;
      };
    }>(`/api/AI/conversation/${conversationId}/history`, { auth: true });

    const messages: ChatMessage[] = res.data.messages.map((m) => ({
      id: nanoid(),
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || new Date().toISOString(),
    }));
    dispatch(fetchHistorySuccess({ conversationId, messages }));
  } catch (e: any) {
    dispatch(fetchHistoryFailure(e?.message || "Error cargando historial"));
    throw e;
  }
};

export const createConversation = (title: string) => async (dispatch: AppDispatch) => {
  try {
    const res = await apiFetch<{
      success: boolean;
      data: { conversationId: number; title: string; userId: number; createdAt: string };
    }>("/api/AI/conversation", { method: "POST", body: { title }, auth: true });

    const conv: Conversation = { id: res.data.conversationId, title: res.data.title, created_at: res.data.createdAt };
    dispatch(createConversationSuccess(conv));
    return conv;
  } catch (e: any) {
    dispatch(createConversationFailure(e?.message || "No se pudo crear la conversación"));
    throw e;
  }
};

export const sendMessage = (conversationId: number, question: string) =>
  async (dispatch: AppDispatch) => {
    try {

      const userMsg: ChatMessage = { id: nanoid(), role: "user", content: question, timestamp: new Date().toISOString() };
      dispatch(pushUserMessage({ conversationId, message: userMsg }));

      dispatch(sendMessageStart());
      
      // ✅ Reactivado: Llamada real al API
      const res = await apiFetch<{
        success: boolean;
        data: { response: string; timestamp?: string };
      }>("/api/AI/ask", { method: "POST", auth: true, body: { question, conversationId } });

      const assistant: ChatMessage = { 
        id: nanoid(), 
        role: "assistant", 
        content: res.data.response, 
        timestamp: res.data.timestamp || new Date().toISOString() 
      };
      dispatch(sendMessageSuccess({ conversationId, assistant }));
    } catch (e: any) {
      dispatch(sendMessageFailure(e?.message || "No se pudo enviar el mensaje"));
      throw e;
    }
  };

export const updateConversationTitle = (conversationId: number, title: string) =>
  async (dispatch: AppDispatch) => {
    try {
      const res = await apiFetch<{
        success: boolean;
        data: { conversationId: number; title: string; updatedAt: string };
      }>(`/api/AI/conversation/${conversationId}/update-title`, {
        method: "PUT",
        auth: true,
        body: { title }
      });

      dispatch(updateConversationTitleAction({ conversationId, title }));
      return res.data;
    } catch (e: any) {
      throw e;
    }
  };

