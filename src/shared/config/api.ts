// API Configuration
// Works both in local and production (Railway)

// Normalizar URL para asegurar que tenga protocolo
const normalizeUrl = (url: string): string => {
  if (!url) return url;
  
  // Remover espacios
  url = url.trim();
  
  // Si ya tiene protocolo, retornar tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(/\/$/, ''); // Remover trailing slash
  }
  
  // Si no tiene protocolo, agregar https://
  return `https://${url}`.replace(/\/$/, ''); // Remover trailing slash
};

// Obtener la URL del API desde variables de entorno
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // En desarrollo, usar localhost por defecto
  if (import.meta.env.DEV) {
    const devUrl = envUrl || 'http://localhost:3000';
    return normalizeUrl(devUrl);
  }
  
  // En producción, la variable DEBE estar configurada
  if (!envUrl) {
    console.error('❌ ERROR: VITE_API_URL no está configurada en Netlify');
    console.error('📋 Configura la variable de entorno en Netlify:');
    console.error('   - Nombre: VITE_API_URL');
    console.error('   - Valor: https://tu-backend.railway.app');
    throw new Error('VITE_API_URL no está configurada. Configúrala en Netlify → Site settings → Environment variables');
  }
  
  return normalizeUrl(envUrl);
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
};

export const getApiUrl = (endpoint: string): string => {
  const baseURL = API_CONFIG.baseURL.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseURL}${cleanEndpoint}`;
};

