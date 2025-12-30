import React, { useState, useEffect, useMemo } from 'react';
import { Folder, File, RefreshCw, Settings, X, Edit, ChevronRight, Home, ArrowLeft, CheckSquare, Square, Search, ArrowUpDown, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../shared/constants';
import { isUserAdmin } from '../../shared/utils/jwtHelper';
import { trackedFilesApi } from '../../shared/api/trackedFilesApi';
import type { TrackedFile } from '../../shared/api/trackedFilesApi';
import { RagSyncPanel } from '../components/RagSyncPanel';

interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size?: number;
  modifiedTime?: string;
  webViewLink?: string;
  parentId?: string;
}

interface DocumentSource {
  id: number;
  name: string;
  provider: string;
  rootFolderId: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  decryptedCredentials?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

export const DocumentExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = isUserAdmin();
  
  const [sources, setSources] = useState<DocumentSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DocumentSource | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [breadcrumb, setBreadcrumb] = useState<Array<{ id: string | undefined; name: string }>>([]);
  const [navigationHistory, setNavigationHistory] = useState<Array<string | undefined>>([]);
  const [showEditSourceModal, setShowEditSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState<DocumentSource | null>(null);
  const [editSourceForm, setEditSourceForm] = useState({
    name: '',
    accessToken: '',
    refreshToken: '',
    folderId: '',
  });
  const [trackedFilesMap, setTrackedFilesMap] = useState<Record<string, TrackedFile>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'type' | 'name' | 'date'>('type');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [togglingFileId, setTogglingFileId] = useState<string | null>(null);
  const [unraggingFileId, setUnraggingFileId] = useState<string | null>(null);

  const filteredAndSortedFiles = useMemo(() => {
    let filteredFiles = files.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isAdmin) {
      filteredFiles = filteredFiles.filter(file => {
        if (file.isFolder) {
          const tracked = trackedFilesMap[file.id];
          
          if (tracked) {
            return tracked.status !== 'error';
          }
          
          const hasProcessedFiles = Object.values(trackedFilesMap).some((trackedFile: any) => {
            const filePath = trackedFile.filePath || '';
            const isInFolder = filePath.includes(file.name + '/') || 
                              filePath.startsWith(file.name + '/') ||
                              (filePath === file.name && trackedFile.isFolder);
            
            return isInFolder && trackedFile.status === 'completed' && trackedFile.lastProcessedAt !== null;
          });
          
          return hasProcessedFiles;
        }
        
        const tracked = trackedFilesMap[file.id];
        if (!tracked) {
          const trackedByName = Object.values(trackedFilesMap).find((t: any) => 
            t.fileName === file.name && !t.isFolder
          );
          if (trackedByName) {
            return true;
          }
          const trackedByPartialName = Object.values(trackedFilesMap).find((t: any) => 
            (t.fileName.includes(file.name) || file.name.includes(t.fileName)) && 
            !t.isFolder
          );
          if (trackedByPartialName) {
            return true;
          }
          return false;
        }
        
        return true;
      });
    }

    filteredFiles.sort((a, b) => {
      if (sortBy === 'type') {
        if (a.isFolder !== b.isFolder) {
          return sortOrder === 'asc' 
            ? (a.isFolder ? -1 : 1) 
            : (a.isFolder ? 1 : -1);
        }
      }

      if (sortBy === 'name') {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }

      if (sortBy === 'date') {
        const dateA = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
        const dateB = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
        if (dateA < dateB) return sortOrder === 'asc' ? -1 : 1;
        if (dateA > dateB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }

      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      return 0;
    });

    return filteredFiles;
  }, [files, searchQuery, sortBy, sortOrder, isAdmin, trackedFilesMap]);

  useEffect(() => {
    loadSources();
  }, []);

  useEffect(() => {
    if (selectedSource) {
      loadTrackedFiles();
    }
  }, [selectedSource]);

  useEffect(() => {
    const handleSyncCompleted = () => {
      if (selectedSource) {
        loadTrackedFiles();
      }
    };

    window.addEventListener('rag-sync-completed', handleSyncCompleted);
    return () => {
      window.removeEventListener('rag-sync-completed', handleSyncCompleted);
    };
  }, [selectedSource]);

  const loadSources = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/document-sources`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Error al cargar fuentes');
      }
      
      const data = await response.json();
      setSources(data);
      if (data.length > 0) {
        setSelectedSource(data[0]);
        setBreadcrumb([{ id: undefined, name: 'Raíz' }]);
        loadFiles(data[0].id, undefined, true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar fuentes');
    }
  };

  const loadFiles = async (sourceId: number, folderId?: string, silent = false, folderName?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = folderId 
        ? `${API_BASE_URL}/api/document-sources/${sourceId}/files?folderId=${folderId}`
        : `${API_BASE_URL}/api/document-sources/${sourceId}/files`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Error al cargar archivos');
      }
      
      const data = await response.json();
      setFiles(data);
      setCurrentFolderId(folderId);
      
      if (!isAdmin && selectedSource) {
        loadTrackedFiles();
      }
      
      if (!folderId) {
        setBreadcrumb([{ id: undefined, name: 'Raíz' }]);
      } else if (folderName) {
        const existingIndex = breadcrumb.findIndex(item => item.id === folderId);
        if (existingIndex >= 0) {
          setBreadcrumb(breadcrumb.slice(0, existingIndex + 1));
        } else {
          setBreadcrumb([...breadcrumb, { id: folderId, name: folderName }]);
        }
      }
      
      setNavigationHistory([...navigationHistory, folderId]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar archivos';
      if (!silent) {
        toast.error(errorMessage, { autoClose: 5000 });
      }
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTrackedFiles = async () => {
    if (!selectedSource) {
      return;
    }
    
    try {
      const map = await trackedFilesApi.getTrackedFilesMap(selectedSource.id);
      setTrackedFilesMap(map);
    } catch (error) {
      // Silent error
    }
  };

  const handleCheckboxChange = async (file: CloudFile) => {
    if (!selectedSource || togglingFileId) return;

    const isTracked = trackedFilesMap[file.id];
    setTogglingFileId(file.id);
    
    try {
      if (isTracked) {
        await trackedFilesApi.untrackFile(selectedSource.id, file.id);
        toast.success(`${file.name} removido del RAG`);
      } else {
        await trackedFilesApi.trackFile({
          sourceId: selectedSource.id,
          fileId: file.id,
          fileName: file.name,
          filePath: breadcrumb.map(b => b.name).join('/') + '/' + file.name,
          isFolder: file.isFolder,
          includeChildren: file.isFolder,
        });
        toast.success(`${file.name} agregado al RAG (${file.isFolder ? 'incluye subcarpetas' : 'archivo'})`);
      }
      
      await loadTrackedFiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar archivo');
    } finally {
      setTogglingFileId(null);
    }
  };

  const handleUnragFile = async (file: CloudFile) => {
    if (!selectedSource || unraggingFileId || file.isFolder) return;

    const tracked = trackedFilesMap[file.id];
    if (!tracked || tracked.status !== 'completed' || !tracked.lastProcessedAt) {
      toast.warning('Este archivo no está procesado en el RAG');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que quieres des-ragear "${file.name}"? Esto eliminará todos los chunks vectorizados y el tracking del archivo.`)) {
      return;
    }

    setUnraggingFileId(file.id);
    
    try {
      await trackedFilesApi.unragFile(selectedSource.id, file.id);
      toast.success(`${file.name} des-rageado exitosamente`);
      await loadTrackedFiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al des-ragear archivo');
    } finally {
      setUnraggingFileId(null);
    }
  };

  const handleFileDoubleClick = (file: CloudFile) => {
    if (file.isFolder) {
      if (selectedSource) {
        loadFiles(selectedSource.id, file.id, false, file.name);
      }
    } else {
      if (!isAdmin) {
        const tracked = trackedFilesMap[file.id];
        if (!tracked || tracked.status !== 'completed' || !tracked.lastProcessedAt) {
          toast.error('Este archivo aún no ha sido procesado. Solo puedes consultar archivos que ya están en el RAG.');
          return;
        }
      }
      
      navigate('/home', { 
        state: { 
          fileInfo: {
            sourceId: selectedSource?.id,
            fileId: file.id,
            fileName: file.name,
          }
        } 
      });
    }
  };

  const goBack = () => {
    if (breadcrumb.length > 1 && selectedSource) {
      const previousFolder = breadcrumb[breadcrumb.length - 2];
      setBreadcrumb(breadcrumb.slice(0, -1));
      loadFiles(selectedSource.id, previousFolder.id, false);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    if (selectedSource && index < breadcrumb.length) {
      const targetFolder = breadcrumb[index];
      setBreadcrumb(breadcrumb.slice(0, index + 1));
      loadFiles(selectedSource.id, targetFolder.id, false);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };


  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleEditSource = async (source: DocumentSource) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/document-sources/${source.id}?includeCredentials=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener detalles de la fuente');
      }

      const fullSource = await response.json();
      
      setEditingSource(fullSource);
      setEditSourceForm({
        name: fullSource.name,
        accessToken: fullSource.decryptedCredentials?.accessToken || '',
        refreshToken: fullSource.decryptedCredentials?.refreshToken || '',
        folderId: fullSource.rootFolderId || '',
      });
      setShowEditSourceModal(true);
    } catch (error) {
      toast.error('Error al cargar los detalles de la fuente');
    }
  };

  const handleUpdateSource = async () => {
    if (!editingSource) return;

    if (!editSourceForm.name && !editSourceForm.accessToken && !editSourceForm.folderId) {
      toast.warning('Completa al menos un campo para actualizar');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const updateData: Record<string, unknown> = {};
      
      if (editSourceForm.name && editSourceForm.name.trim() !== '') {
        updateData.name = editSourceForm.name;
      }
      
      if (editSourceForm.accessToken && editSourceForm.accessToken.trim() !== '') {
        updateData.credentials = {
          accessToken: editSourceForm.accessToken,
          refreshToken: editSourceForm.refreshToken || undefined,
        };
      }
      
      if (editSourceForm.folderId !== (editingSource.rootFolderId || '')) {
        updateData.rootFolderId = editSourceForm.folderId || null;
      }

      const response = await fetch(`${API_BASE_URL}/api/document-sources/${editingSource.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Error al actualizar la fuente');
      }

      toast.success('Fuente actualizada exitosamente');
      setShowEditSourceModal(false);
      setEditingSource(null);
      setEditSourceForm({
        name: '',
        accessToken: '',
        refreshToken: '',
        folderId: '',
      });
      loadSources();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar la fuente';
      toast.error(errorMessage, { autoClose: 5000 });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <div className="bg-slate-800 border-b border-slate-700 p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold">Explorador de Documentos</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Haz doble clic en un archivo para consultar con la IA
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => selectedSource && loadFiles(selectedSource.id, currentFolderId)}
              disabled={loading}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm sm:text-base flex-1 sm:flex-initial justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {sources.length > 0 && (
          <div className="mt-2 sm:mt-4 flex items-center gap-2">
            <select
              value={selectedSource?.id || ''}
              onChange={(e) => {
                const source = sources.find(s => s.id === Number(e.target.value));
                if (source) {
                  setSelectedSource(source);
                  setBreadcrumb([{ id: undefined, name: 'Raíz' }]);
                  setNavigationHistory([]);
                  loadFiles(source.id);
                }
              }}
              className="flex-1 md:flex-initial px-2 sm:px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-sm sm:text-base"
            >
              {sources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name} ({source.provider})
                </option>
              ))}
            </select>
            {isAdmin && selectedSource && (
              <button
                onClick={() => handleEditSource(selectedSource)}
                className="px-2 sm:px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex-shrink-0"
                title="Editar fuente"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {sources.length > 0 && breadcrumb.length > 0 && (
          <div className="mt-2 sm:mt-4 flex items-center gap-1 sm:gap-2">
            <button
              onClick={goBack}
              disabled={breadcrumb.length <= 1}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              title="Volver atrás"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-1 flex-1 overflow-x-auto">
              <button
                onClick={() => navigateToBreadcrumb(0)}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-xs sm:text-sm flex-shrink-0"
              >
                <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Raíz</span>
              </button>

              {breadcrumb.slice(1).map((item, index) => (
                <React.Fragment key={item.id || index}>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                  <button
                    onClick={() => navigateToBreadcrumb(index + 1)}
                    className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                  >
                    {item.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="bg-slate-800 border-b border-slate-700 p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar archivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-slate-400 text-sm sm:text-base"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'type' | 'name' | 'date')}
                className="px-2 sm:px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white text-xs sm:text-sm"
              >
                <option value="type">Tipo</option>
                <option value="name">Nombre</option>
                <option value="date">Fecha</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 sm:px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-white text-xs sm:text-sm"
                title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">{sortOrder === 'asc' ? '↑' : '↓'}</span>
              </button>
            </div>
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs text-slate-400">
              {filteredAndSortedFiles.length} de {files.length} archivos
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-2 sm:p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <div className="text-slate-400">Cargando archivos...</div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Folder className="w-16 h-16 mb-4 opacity-50" />
            <p>No hay archivos en esta carpeta</p>
          </div>
        ) : filteredAndSortedFiles.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Search className="w-16 h-16 mb-4 opacity-50" />
            <p>No se encontraron archivos con "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredAndSortedFiles.map(file => {
              const isTracked = !!trackedFilesMap[file.id];
              const tracked = trackedFilesMap[file.id];
              const isProcessed = tracked && tracked.status === 'completed' && tracked.lastProcessedAt !== null;
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition-colors group"
                >
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckboxChange(file);
                      }}
                      disabled={togglingFileId !== null}
                      className="flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={togglingFileId === file.id ? 'Procesando...' : (isTracked ? 'Quitar del RAG' : 'Agregar al RAG')}
                    >
                      {togglingFileId === file.id ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      ) : isTracked ? (
                        <CheckSquare className="w-5 h-5 text-green-500" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600 group-hover:text-slate-400" />
                      )}
                    </button>
                  )}

                  <div
                    onDoubleClick={() => handleFileDoubleClick(file)}
                    onClick={() => file.isFolder && !loading && toggleFolder(file.id)}
                    className={`flex items-center gap-2 flex-1 min-w-0 ${file.isFolder && !loading ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {file.isFolder ? (
                      <Folder className={`w-5 h-5 text-yellow-500 flex-shrink-0 ${loading ? 'opacity-50' : ''}`} />
                    ) : (
                      <File className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    )}
                    <span className={`truncate ${loading && file.isFolder ? 'opacity-50' : ''}`}>{file.name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    {!file.isFolder && <span>{formatFileSize(file.size)}</span>}
                    {file.modifiedTime && (
                      <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                    )}
                  </div>

                  {isAdmin && isProcessed && !file.isFolder && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnragFile(file);
                      }}
                      disabled={unraggingFileId !== null}
                      className="flex-shrink-0 p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Des-ragear archivo (eliminar chunks y tracking)"
                    >
                      {unraggingFileId === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {sources.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Settings className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg mb-2">No hay fuentes configuradas</p>
          <p className="text-sm">Contacta a un administrador para agregar fuentes</p>
        </div>
      )}

      {showEditSourceModal && editingSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Editar Fuente: {editingSource.name}</h2>
              <button
                onClick={() => {
                  setShowEditSourceModal(false);
                  setEditingSource(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={editSourceForm.name}
                  onChange={(e) => setEditSourceForm({ ...editSourceForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Access Token
                  <span className="text-xs text-slate-400 ml-2">(Token actual mostrado)</span>
                </label>
                <textarea
                  value={editSourceForm.accessToken}
                  onChange={(e) => setEditSourceForm({ ...editSourceForm, accessToken: e.target.value })}
                  placeholder="Token de acceso"
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Edita el token si necesitas actualizarlo</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Refresh Token
                  <span className="text-xs text-slate-400 ml-2">(opcional)</span>
                </label>
                <textarea
                  value={editSourceForm.refreshToken}
                  onChange={(e) => setEditSourceForm({ ...editSourceForm, refreshToken: e.target.value })}
                  placeholder="Refresh token"
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ID de Carpeta Raíz
                  <span className="text-xs text-slate-400 ml-2">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={editSourceForm.folderId}
                  onChange={(e) => setEditSourceForm({ ...editSourceForm, folderId: e.target.value })}
                  placeholder="ID de carpeta"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Carpeta inicial para navegar (dejar vacío = raíz)</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditSourceModal(false);
                    setEditingSource(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateSource}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && <RagSyncPanel />}
    </div>
  );
};

