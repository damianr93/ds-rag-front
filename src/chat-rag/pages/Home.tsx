import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import {
  Bot,
  MessageSquarePlus,
  Loader2,
  Send,
  Trash2,
  Plus,
  Edit3,
  Clock,
  FolderOpen,
  Copy,
  Menu,
  ChevronLeft, 
} from "lucide-react";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AppDispatch } from "../../store/store";
import { resetMessagesFor, selectConversation, selectRag, selectSelectedMessages, setError } from "../../store/slices/rag/ragSlice";
import { createConversation, fetchConversations, fetchHistory, sendMessage, updateConversationTitle } from "../../store/slices/rag/rag.thunks";
import { apiFetch } from "../../shared/utils/api";

// ✅ Lock global para prevenir doble creación (fuera del componente para persistir entre renders)
let globalFileProcessingLock = false;


// Sidebar de conversaciones (ahora soporta "collapsed")
const ConversationsSidebar: React.FC<{
  conversations: { id: number; title: string; created_at: string }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onUpdateTitle: (id: number, title: string) => void;
  loading: boolean;
  collapsed: boolean;
}> = ({ conversations, selectedId, onSelect, onNew, onUpdateTitle, loading, collapsed }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartEdit = (id: number, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onUpdateTitle(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <aside
      className={`bg-slate-800/70 border-r border-slate-700 p-4 flex flex-col transition-all duration-300
      ${collapsed ? "w-0 overflow-hidden p-0 border-r-0" : "w-80"}`}
      aria-hidden={collapsed}
    >
      {!collapsed && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-white font-semibold">Conversaciones</h2>
            </div>
            <button
              onClick={onNew}
              className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              title="Nueva conversación"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {loading && (
              <div className="flex items-center text-slate-300 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando...
              </div>
            )}
            {!loading && conversations.length === 0 && (
              <div className="text-slate-400 text-sm flex flex-col items-center mt-8">
                <FolderOpen className="w-6 h-6 mb-2" />
                <p>No hay conversaciones aún.</p>
                <p>Creá una nueva con el botón “Nueva”.</p>
              </div>
            )}
            {conversations.map((c) => {
              const active = c.id === selectedId;
              const isEditing = editingId === c.id;
              
              return (
                <div
                  key={c.id}
                  className={`w-full p-3 rounded-lg transition-colors border ${
                    active
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-800 text-white px-2 py-1 rounded text-sm border border-slate-600 focus:border-blue-400 focus:outline-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelect(c.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{c.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(c.id, c.title);
                          }}
                          className="ml-2 p-1 hover:bg-slate-700 rounded opacity-60 hover:opacity-100"
                          title="Editar título"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div
                        className={`${
                          active ? "text-blue-100" : "text-slate-400"
                        } text-xs mt-1 flex items-center gap-1`}
                      >
                        <Clock className="w-3 h-3" />
                        {new Date(c.created_at).toLocaleString()}
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
};

// Ventana de chat (scroll interno garantizado)
const ChatWindow: React.FC<{
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }[];
  onCopy: (text: string) => void;
}> = ({ messages, onCopy }) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
      {messages.map((m) => {
        const fromUser = m.role === "user";
        return (
          <div
            key={m.id}
            className={`flex ${fromUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-3xl p-4 rounded-2xl shadow-lg ${
                fromUser
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/80 border border-slate-700 text-slate-200"
              }`}
            >
              <div className="whitespace-pre-wrap prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4 -mx-4">
                        <table className="min-w-full border-collapse border border-slate-600 text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-slate-700/80">{children}</thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="bg-slate-800/30 divide-y divide-slate-600">{children}</tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="hover:bg-slate-700/30 transition-colors">{children}</tr>
                    ),
                    th: ({ children }) => (
                      <th className="border border-slate-600 px-4 py-2 text-left font-semibold text-slate-200 bg-slate-700/60">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-slate-600 px-4 py-2 text-slate-300 align-top">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
              <div
                className={`text-xs mt-2 ${
                  fromUser ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {new Date(m.timestamp).toLocaleTimeString()}
              </div>
              <div className="mt-2">
                <button
                  className="text-xs opacity-80 hover:opacity-100 inline-flex items-center gap-1"
                  onClick={() => onCopy(m.content)}
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
};

export const ChatRagPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const {
    conversations,
    selectedId,
    loadingConversations,
    loadingHistory,
    sending,
    error,
  } = useSelector(selectRag);
  const messages = useSelector(selectSelectedMessages);

  const [input, setInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const hasSelection = useMemo(() => Boolean(selectedId), [selectedId]);
  const hasProcessedFile = useRef(false); // ✅ Flag para prevenir doble procesamiento
  const isProcessing = useRef(false); // ✅ Flag adicional para tracking activo

  // Cargar conversaciones al entrar
  useEffect(() => {
    const fileInfo = (location.state as any)?.fileInfo;
    
    // ✅ Verificación TRIPLE: ref local + ref activo + lock global
    if (hasProcessedFile.current || isProcessing.current || globalFileProcessingLock) {
      console.log('⚠️ Archivo ya procesado, en proceso, o lock global activo - IGNORANDO');
      return;
    }
    
    // ✅ Si hay fileInfo, activar TODOS los locks INMEDIATAMENTE
    if (fileInfo) {
      console.log('🔒 Activando todos los locks para:', fileInfo.fileName);
      isProcessing.current = true;
      hasProcessedFile.current = true;
      globalFileProcessingLock = true;
    }
    
    dispatch(fetchConversations())
      .then(async (convs) => {
        // Si viene desde el explorador, crear nueva conversación con el nombre del archivo
        if (fileInfo) {
          try {
            console.log('📄 Creando conversación para archivo:', fileInfo.fileName);
            const conv: any = await (dispatch as any)(createConversation(fileInfo.fileName));
            console.log('✅ Conversación creada:', conv);
            
            if (conv?.id) {
              // Seleccionar la conversación creada
              dispatch(selectConversation(conv.id));
              dispatch(resetMessagesFor(conv.id));
              
              console.log('❓ Haciendo pregunta sobre el archivo (sin procesarlo nuevamente)...');
              // Solo preguntar, NO procesar
              await askAboutFile(fileInfo, conv.id);
            }
          } catch (e: any) {
            console.error('❌ Error creando conversación:', e);
            toast.error("No se pudo crear la conversación para el archivo");
          }
          // Limpiar el state para evitar reprocesar
          window.history.replaceState({}, document.title);
        } else {
          // Comportamiento normal: seleccionar primera conversación
          const firstId = convs[0]?.id ?? null;
          const targetId = selectedId || firstId;
          if (targetId) dispatch(fetchHistory(targetId));
        }
      })
      .catch((e) => {
        dispatch(setError(e.message));
      });
    
    // ✅ Cleanup: liberar locks después de 5 segundos (por si acaso)
    return () => {
      if (fileInfo) {
        setTimeout(() => {
          console.log('🔓 Liberando lock global (cleanup)');
          globalFileProcessingLock = false;
        }, 5000);
      }
    };
  }, []); // ✅ Array vacío: solo ejecutar una vez

  const askAboutFile = async (
    fileInfo: { sourceId: number; fileId: string; fileName: string },
    conversationId: number
  ) => {
    console.log('💬 Preguntando sobre archivo:', fileInfo.fileName);
    setProcessingFile(true);
    
    try {
      // Solo hacer la pregunta, sin procesar el archivo
      const question = `¿De qué trata el documento "${fileInfo.fileName}"? Dame un resumen detallado de su contenido y después pregúntame qué información específica necesito.`;
      
      console.log('❓ Enviando pregunta a conversación', conversationId);
      
      // Enviar el mensaje automáticamente
      setTimeout(async () => {
        try {
          console.log('🚀 Disparando sendMessage...');
          await dispatch(sendMessage(conversationId, question) as any);
          console.log('✅ Mensaje enviado correctamente');
        } catch (e: any) {
          console.error('❌ Error al enviar mensaje:', e);
          toast.error("Error al enviar la pregunta: " + e.message);
        } finally {
          setProcessingFile(false);
        }
      }, 800);
    } catch (error: any) {
      console.error('❌ Error asking about file:', error);
      toast.error(error.message || "Error al consultar sobre el archivo");
      setProcessingFile(false);
    }
  };

  const onSelectConversation = (id: number) => {
    dispatch(selectConversation(id));
    dispatch(fetchHistory(id));
  };

  const onNewConversation = async () => {
    const title = `Nueva conversación - ${new Date().toLocaleString()}`; // //! permitir renombrar inline después
    try {
      const conv: any = await (dispatch as any)(createConversation(title));
      if (conv?.id) dispatch(resetMessagesFor(conv.id));
    } catch (e: any) {
      toast.error(e.message || "No se pudo crear la conversación");
    }
  };

  const onSend = async () => {
    if (!input.trim() || !selectedId || sending) return;
    const q = input.trim();
    setInput("");

    try {
      await dispatch(
        // nuevo thunk maneja push optimista y respuesta
        sendMessage(selectedId, q) as any
      );
    } catch (e: any) {
      toast.error(e.message || "No se pudo enviar el mensaje");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const onCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Mensaje copiado");
  };

  const onUpdateTitle = async (id: number, title: string) => {
    try {
      await dispatch(updateConversationTitle(id, title) as any);
      toast.success("Título actualizado");
    } catch (e: any) {
      toast.error(e.message || "No se pudo actualizar el título");
    }
  };

  // Elimina la conversación en backend y refresca el store/UI
  const deleteAndRefresh = async (id: number) => {
    try {
      await apiFetch<{ success: boolean }>("/api/AI/conversation/delete", {
        method: "POST",
        body: { conversationId: id },
        auth: true,
      });

      const convs = await dispatch(fetchConversations());
      if (selectedId === id) {
        const nextId = convs[0]?.id;
        if (nextId) {
          dispatch(selectConversation(nextId));
          dispatch(fetchHistory(nextId));
        }
      }
      toast.success("Conversación eliminada");
      return true;
    } catch (e: any) {
      const msg = e?.message || "No se pudo eliminar la conversación";
      toast.error(msg);
      return false;
    }
  };

  // Para mi yo del futuro:
  // - El wrapper principal usa h-screen para limitar todo a 100vh.
  // - Cada contenedor flex que tenga hijos con overflow necesita min-h-0.
  // - Así garantizamos que el scroll vive adentro del chat y no estira el layout.
  return (
    <div className="h-screen min-h-0 flex">
      <ConversationsSidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={onSelectConversation}
        onNew={onNewConversation}
        onUpdateTitle={onUpdateTitle}
        loading={loadingConversations}
        collapsed={sidebarCollapsed}
      />

      <div className="flex-1 min-h-0 flex flex-col bg-gradient-to-br from-slate-900 via-blue-900/10 to-slate-800">
        {/* Header Chat */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2">
            {/* Toggle sidebar */}
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
              title={
                sidebarCollapsed ? "Mostrar historial" : "Ocultar historial"
              }
              aria-expanded={!sidebarCollapsed}
            >
              {sidebarCollapsed ? (
                <Menu className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>

            <MessageSquarePlus className="w-5 h-5 text-blue-400" />
            <h1 className="text-white font-semibold">Asistente RAG</h1>
            {loadingHistory && (
              <span className="ml-2 text-xs text-slate-400 inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Cargando
                historial...
              </span>
            )}
            {processingFile && (
              <span className="ml-2 text-xs text-blue-400 inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Consultando documento...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Limpia mensajes locales */}
            <button
              onClick={() => selectedId && deleteAndRefresh(selectedId)}
              className="text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
              title="Limpiar mensajes locales"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido: Chat con scroll interno */}
        <ChatWindow messages={messages} onCopy={onCopy} />

        {/* Input */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/40">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/80 border border-slate-600 rounded-2xl p-3 shadow-lg">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={
                    hasSelection
                      ? "Escribe tu consulta... (Enter para enviar, Shift+Enter para nueva línea)"
                      : "Creá una conversación para empezar…"
                  }
                  disabled={!hasSelection || sending}
                  rows={1}
                  className="flex-1 bg-transparent text-white placeholder-slate-400 border-none outline-none resize-none min-h-[44px] max-h-[200px]"
                />
                <button
                  onClick={onSend}
                  disabled={!hasSelection || sending || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
              {error && (
                <div className="text-xs text-red-400 mt-2">{error}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


