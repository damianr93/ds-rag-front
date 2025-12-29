// API Configuration
// Works both in local and production (Railway)

// Obtener la URL del API desde variables de entorno
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // En desarrollo, usar localhost por defecto
  if (import.meta.env.DEV) {
    return envUrl || 'http://localhost:3000';
  }
  
  // En producción, la variable DEBE estar configurada
  if (!envUrl) {
    console.error('❌ ERROR: VITE_API_URL no está configurada en Netlify');
    console.error('📋 Configura la variable de entorno en Netlify:');
    console.error('   - Nombre: VITE_API_URL');
    console.error('   - Valor: https://tu-backend.railway.app');
    throw new Error('VITE_API_URL no está configurada. Configúrala en Netlify → Site settings → Environment variables');
  }
  
  return envUrl;
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
};

// Log para debug (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔧 API Config:', {
    baseURL: API_CONFIG.baseURL,
    envVar: import.meta.env.VITE_API_URL,
    mode: import.meta.env.MODE,
  });
} else {
  // En producción, log mínimo
  console.log('🌐 API Base URL:', API_CONFIG.baseURL);
}

export const getApiUrl = (endpoint: string): string => {
  const baseURL = API_CONFIG.baseURL.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseURL}${cleanEndpoint}`;
};

