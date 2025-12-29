import React, { useState, useEffect } from 'react';
import { Settings, Trash2, RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../shared/constants';

interface DocumentSource {
  id: number;
  userId: number;
  name: string;
  provider: string;
  rootFolderId: string | null;
  isActive: boolean;
  lastError: string | null;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  decryptedCredentials?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

export const AdminPanelPage: React.FC = () => {
  const [sources, setSources] = useState<DocumentSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<DocumentSource | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewSourceModal, setShowNewSourceModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSourceForm, setNewSourceForm] = useState({
    name: '',
    provider: 'google_drive' as 'google_drive' | 'dropbox' | 'onedrive',
    useOAuth: true,
    clientId: '',
    clientSecret: '',
    accessToken: '',
    refreshToken: '',
    rootFolderId: '',
  });

  useEffect(() => {
    loadAllSources();
  }, []);

  const loadAllSources = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/document-sources/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar fuentes');
      }

      const data = await response.json();
      setSources(data);
    } catch (error) {
      console.error('Error loading sources:', error);
      toast.error('Error al cargar las fuentes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (sourceId: number, currentState: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/document-sources/${sourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !currentState,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      toast.success(`Fuente ${!currentState ? 'activada' : 'desactivada'}`);
      loadAllSources();
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error('Error al cambiar el estado');
    }
  };

  const handleDelete = async (sourceId: number, sourceName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la fuente "${sourceName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/document-sources/${sourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar fuente');
      }

      toast.success('Fuente eliminada exitosamente');
      loadAllSources();
    } catch (error) {
      console.error('Error deleting source:', error);
      toast.error('Error al eliminar la fuente');
    }
  };

  const handleCreateSource = async () => {
    if (!newSourceForm.name) {
      toast.error('Por favor ingresa un nombre para la fuente');
      return;
    }

    if (newSourceForm.useOAuth) {
      if (!newSourceForm.clientId || !newSourceForm.clientSecret) {
        toast.error('Por favor completa el Client ID y Client Secret');
        return;
      }

      try {
        setCreating(true);
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/api/document-sources/oauth/authorize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            provider: newSourceForm.provider,
            clientId: newSourceForm.clientId,
            clientSecret: newSourceForm.clientSecret,
            sourceName: newSourceForm.name,
            rootFolderId: newSourceForm.rootFolderId || undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Error al iniciar OAuth');
        }

        const { authUrl } = await response.json();
        
        const width = 600;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const popup = window.open(
          authUrl,
          'OAuth Authorization',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        // Esperar a que se cierre el popup
        const checkPopup = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(checkPopup);
            setCreating(false);
            loadAllSources();
            setShowNewSourceModal(false);
            setNewSourceForm({
              name: '',
              provider: 'google_drive',
              useOAuth: true,
              clientId: '',
              clientSecret: '',
              accessToken: '',
              refreshToken: '',
              rootFolderId: '',
            });
          }
        }, 500);

      } catch (error) {
        console.error('Error creating source:', error);
        toast.error(error instanceof Error ? error.message : 'Error al crear la fuente');
        setCreating(false);
      }
    } else {
      // Modo manual
      if (!newSourceForm.accessToken) {
        toast.error('Por favor ingresa el Access Token');
        return;
      }

      try {
        setCreating(true);
        const token = localStorage.getItem('auth_token');
        
        // Crear la fuente
        const response = await fetch(`${API_BASE_URL}/api/document-sources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newSourceForm.name,
            provider: newSourceForm.provider,
            credentials: {
              accessToken: newSourceForm.accessToken,
              refreshToken: newSourceForm.refreshToken || undefined,
            },
            rootFolderId: newSourceForm.rootFolderId || undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Error al crear fuente');
        }

        const newSource = await response.json();
        
        // ✅ VALIDAR CONEXIÓN: Intentar listar archivos
        toast.info('Validando conexión...');
        const testResponse = await fetch(`${API_BASE_URL}/api/document-sources/${newSource.id}/files`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!testResponse.ok) {
          const error = await testResponse.json();
          // Si falla la validación, eliminar la fuente creada
          await fetch(`${API_BASE_URL}/api/document-sources/${newSource.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          throw new Error(error.error || 'No se pudo conectar con las credenciales proporcionadas');
        }

        toast.success('Fuente creada y validada exitosamente');
        loadAllSources();
        setShowNewSourceModal(false);
        setNewSourceForm({
          name: '',
          provider: 'google_drive',
          useOAuth: true,
          clientId: '',
          clientSecret: '',
          accessToken: '',
          refreshToken: '',
          rootFolderId: '',
        });
      } catch (error) {
        console.error('Error creating source:', error);
        toast.error(error instanceof Error ? error.message : 'Error al crear la fuente');
      } finally {
        setCreating(false);
      }
    }
  };

  const handleViewDetails = async (source: DocumentSource) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/document-sources/${source.id}?includeCredentials=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar detalles');
      }

      const fullSource = await response.json();
      setSelectedSource(fullSource);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Error al cargar los detalles');
    }
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      google_drive: 'Google Drive',
      dropbox: 'Dropbox',
      onedrive: 'OneDrive',
      local: 'Local',
    };
    return names[provider] || provider;
  };

  const getStatusIcon = (isActive: boolean, lastError?: string | null) => {
    if (lastError) {
      return (
        <div title="Con advertencias">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
        </div>
      );
    }
    return isActive ? (
      <div title="Activa">
        <CheckCircle className="w-5 h-5 text-green-500" />
      </div>
    ) : (
      <div title="Inactiva">
        <XCircle className="w-5 h-5 text-red-500" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-white">Cargando fuentes...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Panel de Administración
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Gestión de fuentes de documentos del sistema
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowNewSourceModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Fuente
            </button>
            <button
              onClick={loadAllSources}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400">Total Fuentes</div>
            <div className="text-2xl font-bold mt-1">{sources.length}</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
            <div className="text-sm text-green-400">Activas</div>
            <div className="text-2xl font-bold mt-1 text-green-400">
              {sources.filter(s => s.isActive).length}
            </div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
            <div className="text-sm text-red-400">Inactivas</div>
            <div className="text-2xl font-bold mt-1 text-red-400">
              {sources.filter(s => !s.isActive).length}
            </div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
            <div className="text-sm text-yellow-400">Con Errores</div>
            <div className="text-2xl font-bold mt-1 text-yellow-400">
              {sources.filter(s => s.lastError).length}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Settings className="w-16 h-16 mb-4 opacity-50" />
            <p>No hay fuentes configuradas</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Última Sync
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusIcon(source.isActive, source.lastError || undefined)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{source.name}</div>
                      {source.lastError && (
                        <div className="text-xs text-yellow-400 mt-1 truncate max-w-xs" title={source.lastError}>
                          ⚠️ {source.lastError}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                        {getProviderName(source.provider)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {source.userName || `User #${source.userId}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {source.lastSyncAt
                        ? new Date(source.lastSyncAt).toLocaleString()
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(source)}
                          className="p-2 hover:bg-slate-600 rounded transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(source.id, source.isActive)}
                          className={`p-2 hover:bg-slate-600 rounded transition-colors ${
                            source.isActive ? 'text-green-400' : 'text-red-400'
                          }`}
                          title={source.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {source.isActive ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(source.id, source.name)}
                          className="p-2 hover:bg-red-600 rounded transition-colors text-red-400"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showDetailsModal && selectedSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Detalles: {selectedSource.name}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">ID</label>
                  <div className="font-mono">{selectedSource.id}</div>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Usuario ID</label>
                  <div className="font-mono">{selectedSource.userId}</div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Proveedor</label>
                <div>{getProviderName(selectedSource.provider)}</div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Carpeta Raíz</label>
                <div className="font-mono text-sm">
                  {selectedSource.rootFolderId || '(Raíz del proveedor)'}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Estado</label>
                <div className="flex items-center gap-2 mt-1">
                  {selectedSource.isActive ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-400">Activa</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-400">Inactiva</span>
                    </>
                  )}
                </div>
              </div>

              {selectedSource.lastError && (
                <div>
                  <label className="text-xs text-slate-400">Último Error</label>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 text-sm text-yellow-300 mt-1">
                    {selectedSource.lastError}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400">Access Token (primeros 50 caracteres)</label>
                <div className="bg-slate-700 rounded p-2 font-mono text-xs break-all mt-1">
                  {selectedSource.decryptedCredentials?.accessToken?.substring(0, 50) || 'No disponible'}...
                </div>
              </div>

              {selectedSource.decryptedCredentials?.refreshToken && (
                <div>
                  <label className="text-xs text-slate-400">Tiene Refresh Token</label>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-400">Sí (puede renovarse automáticamente)</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Creada</label>
                  <div className="text-sm">{new Date(selectedSource.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Última Actualización</label>
                  <div className="text-sm">{new Date(selectedSource.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Fuente */}
      {showNewSourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Nueva Fuente de Documentos</h2>
              <button
                onClick={() => !creating && setShowNewSourceModal(false)}
                disabled={creating}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={newSourceForm.name}
                  onChange={(e) => setNewSourceForm({ ...newSourceForm, name: e.target.value })}
                  placeholder="Ej: Drive Corporativo"
                  disabled={creating}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Fuente</label>
                <select
                  value={newSourceForm.provider}
                  onChange={(e) => setNewSourceForm({ ...newSourceForm, provider: e.target.value as any })}
                  disabled={creating}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="google_drive">Google Drive</option>
                  <option value="dropbox">Dropbox</option>
                  <option value="onedrive">OneDrive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Método de Autenticación</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSourceForm({ ...newSourceForm, useOAuth: true })}
                    disabled={creating}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                      newSourceForm.useOAuth
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    OAuth (Recomendado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSourceForm({ ...newSourceForm, useOAuth: false })}
                    disabled={creating}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                      !newSourceForm.useOAuth
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Manual
                  </button>
                </div>
              </div>

              {newSourceForm.useOAuth ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Client ID</label>
                    <input
                      type="text"
                      value={newSourceForm.clientId}
                      onChange={(e) => setNewSourceForm({ ...newSourceForm, clientId: e.target.value })}
                      placeholder="Tu Client ID"
                      disabled={creating}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Client Secret</label>
                    <input
                      type="password"
                      value={newSourceForm.clientSecret}
                      onChange={(e) => setNewSourceForm({ ...newSourceForm, clientSecret: e.target.value })}
                      placeholder="Tu Client Secret"
                      disabled={creating}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm disabled:opacity-50"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Access Token</label>
                    <textarea
                      value={newSourceForm.accessToken}
                      onChange={(e) => setNewSourceForm({ ...newSourceForm, accessToken: e.target.value })}
                      placeholder="Pega tu access token aquí"
                      disabled={creating}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Refresh Token (opcional)
                    </label>
                    <textarea
                      value={newSourceForm.refreshToken}
                      onChange={(e) => setNewSourceForm({ ...newSourceForm, refreshToken: e.target.value })}
                      placeholder="Pega tu refresh token aquí (opcional)"
                      disabled={creating}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm disabled:opacity-50"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Carpeta Raíz (opcional)
                </label>
                <input
                  type="text"
                  value={newSourceForm.rootFolderId}
                  onChange={(e) => setNewSourceForm({ ...newSourceForm, rootFolderId: e.target.value })}
                  placeholder="ID de la carpeta (dejar vacío para raíz)"
                  disabled={creating}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewSourceModal(false)}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSource}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {newSourceForm.useOAuth ? 'Conectando...' : 'Validando...'}
                    </>
                  ) : (
                    newSourceForm.useOAuth ? 'Conectar con ' + (
                      newSourceForm.provider === 'google_drive' ? 'Google' :
                      newSourceForm.provider === 'onedrive' ? 'Microsoft' :
                      'Dropbox'
                    ) : 'Crear y Validar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

