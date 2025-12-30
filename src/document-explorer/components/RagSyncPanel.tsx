import React, { useState, useEffect, useRef } from 'react';
import { Play, X, CheckCircle, XCircle, Info, AlertTriangle, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../shared/constants';
import { isUserAdmin } from '../../shared/utils/jwtHelper';

interface SyncLog {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  fileId?: string;
  fileName?: string;
}

interface SyncResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  logs: SyncLog[];
}

export const RagSyncPanel: React.FC = () => {
  const isAdmin = isUserAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [result, setResult] = useState<SyncResult | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // No renderizar si no es admin
  if (!isAdmin) return null;

  useEffect(() => {
    // Auto-scroll al último log
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startSync = async () => {
    setIsSyncing(true);
    setLogs([]);
    setResult(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/tracked-files/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al sincronizar');
      }

      const data: SyncResult = await response.json();
      setResult(data);
      setLogs(data.logs);

      if (data.success) {
        toast.success(`Sincronización completada: ${data.processedCount} archivos procesados`);
        window.dispatchEvent(new CustomEvent('rag-sync-completed'));
      } else {
        toast.error('Sincronización completada con errores');
        window.dispatchEvent(new CustomEvent('rag-sync-completed'));
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error(error instanceof Error ? error.message : 'Error al sincronizar');
      
      // Agregar log de error
      setLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido',
      }]);
    } finally {
      setIsSyncing(false);
    }
  };

  const getLogIcon = (level: SyncLog['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getLogColor = (level: SyncLog['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
      default:
        return 'text-slate-300';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <>
      {/* Botón flotante para abrir panel */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          disabled={isSyncing}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2 z-40"
          title="Sincronizar archivos con RAG"
        >
          {isSyncing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Sincronizando...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Sincronizar RAG</span>
            </>
          )}
        </button>
      )}

      {/* Panel de logs */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[600px] h-[500px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">Sincronización RAG</h3>
              {isSyncing && <Loader className="w-5 h-5 text-blue-500 animate-spin" />}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          {result && (
            <div className="grid grid-cols-2 gap-4 p-4 border-b border-slate-700 bg-slate-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{result.processedCount}</div>
                <div className="text-xs text-slate-400">Procesados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{result.errorCount}</div>
                <div className="text-xs text-slate-400">Errores</div>
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Info className="w-12 h-12 mb-2 opacity-50" />
                <p>Presiona "Iniciar" para comenzar la sincronización</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-sm p-2 rounded hover:bg-slate-800 transition-colors"
                >
                  {getLogIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 font-mono">
                        {formatTime(log.timestamp)}
                      </span>
                      {log.fileName && (
                        <span className="text-xs text-slate-600 truncate">
                          {log.fileName}
                        </span>
                      )}
                    </div>
                    <p className={`${getLogColor(log.level)} break-words`}>
                      {log.message}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Footer con botón */}
          <div className="p-4 border-t border-slate-700 bg-slate-800">
            <button
              onClick={startSync}
              disabled={isSyncing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isSyncing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Iniciar Sincronización</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

