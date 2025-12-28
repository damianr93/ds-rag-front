import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../shared/constants';

export const OAuthSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const hasProcessed = useRef(false); // ✅ Flag para prevenir duplicados

  useEffect(() => {
    // ✅ Prevenir múltiples ejecuciones
    if (hasProcessed.current) {
      console.log('⚠️ OAuth callback ya procesado, ignorando duplicado');
      return;
    }

    const saveTokens = async () => {
      // ✅ Marcar como procesado ANTES de hacer la llamada
      hasProcessed.current = true;
      
      try {
        const provider = searchParams.get('provider');
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const sourceName = searchParams.get('sourceName');
        const clientId = searchParams.get('clientId');
        const clientSecret = searchParams.get('clientSecret');
        const rootFolderId = searchParams.get('rootFolderId');
        const sourceId = searchParams.get('sourceId');

        console.log('🔐 Guardando tokens OAuth...', { provider, sourceName, sourceId });

        if (!provider || !accessToken) {
          throw new Error('Faltan parámetros de OAuth');
        }

        const token = localStorage.getItem('auth_token');

        if (sourceId) {
          // Actualizar fuente existente
          console.log('📝 Actualizando fuente existente:', sourceId);
          const response = await fetch(`${API_BASE_URL}/api/document-sources/${sourceId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              credentials: {
                accessToken,
                refreshToken: refreshToken || undefined,
              },
            }),
          });

          if (!response.ok) {
            throw new Error('Error al actualizar la fuente');
          }
          console.log('✅ Fuente actualizada exitosamente');
        } else {
          // Crear nueva fuente
          console.log('➕ Creando nueva fuente:', sourceName);
          const response = await fetch(`${API_BASE_URL}/api/document-sources`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: sourceName || `${provider} source`,
              provider,
              credentials: {
                accessToken,
                refreshToken: refreshToken || undefined,
              },
              clientId,
              clientSecret,
              rootFolderId: rootFolderId || undefined,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error creando fuente:', errorData);
            throw new Error(errorData.message || 'Error al crear la fuente');
          }
          
          const result = await response.json();
          console.log('✅ Fuente creada exitosamente:', result);
        }

        setStatus('success');
        toast.success('Autenticación exitosa! Cerrando ventana...');
        
        // Cerrar esta ventana popup automáticamente
        setTimeout(() => {
          window.close();
        }, 1500);
      } catch (error) {
        console.error('❌ Error saving OAuth tokens:', error);
        setStatus('error');
        toast.error(error instanceof Error ? error.message : 'Error en la autenticación');
        
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    saveTokens();
  }, []); // ✅ Array vacío: solo ejecutar una vez al montar

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Procesando autenticación...</h2>
            <p className="text-slate-400">Guardando credenciales de forma segura</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Autenticación exitosa!</h2>
            <p className="text-slate-400">Esta ventana se cerrará automáticamente...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Error en la autenticación</h2>
            <p className="text-slate-400">Esta ventana se cerrará automáticamente...</p>
          </>
        )}
      </div>
    </div>
  );
};

