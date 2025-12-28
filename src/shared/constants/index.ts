// Constantes compartidas para toda la aplicación

// URL base del backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  PROFILE: '/api/auth/profile',
  
  // News
  FEED: '/api/feed/',
  SEARCH: '/api/feed/search',
  KEYWORDS: '/api/feed/keywords',
  SOURCES: '/api/feed/user-sources',
  STATS: '/api/feed/stats',
  
  // Feeds
  FEEDS: '/api/feeds',
  FEED_DATA: (feedId: number) => `/api/feeds/${feedId}/data`,
  FEED_KEYWORDS: (feedId: number) => `/api/feeds/${feedId}/keywords`,
  FEED_SOURCES: (feedId: number) => `/api/feeds/${feedId}/sources`,
  SET_DEFAULT_FEED: (feedId: number) => `/api/feeds/${feedId}/set-default`,
  
  // Global RSS
  GLOBAL_RSS: '/api/global-rss',
  USER_RSS_PREFERENCES: '/api/global-rss/preferences',
  
  // RAG
  RAG_CONVERSATIONS: '/api/AI/conversations',
  RAG_MESSAGES: '/api/AI/messages',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  DISCLAIMER_ACCEPTED: 'disclaimer_accepted',
  FEED_PREFERENCES: 'feed_preferences',
} as const;

export const DEFAULT_FILTERS = {
  COUNTRY: 'ar',
  DATE_RANGE: 'd',
  RESULT_LIMIT: 10,
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export const NEWS_ORIGINS = {
  SERPER: 'serper',
  RSS: 'rss',
} as const;

export const LOADING_MESSAGES = {
  LOADING_FEEDS: 'Cargando feeds...',
  LOADING_NEWS: 'Cargando noticias...',
  LOADING_KEYWORDS: 'Cargando keywords...',
  LOADING_SOURCES: 'Cargando fuentes...',
  SEARCHING: 'Buscando...',
  CREATING_FEED: 'Creando feed...',
  UPDATING_FEED: 'Actualizando feed...',
  DELETING_FEED: 'Eliminando feed...',
  SCRAPING_CONTENT: 'Extrayendo contenido...',
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  AUTH_ERROR: 'Error de autenticación. Inicia sesión nuevamente.',
  PERMISSION_ERROR: 'No tienes permisos para realizar esta acción.',
  VALIDATION_ERROR: 'Los datos ingresados no son válidos.',
  SERVER_ERROR: 'Error del servidor. Intenta nuevamente.',
  UNKNOWN_ERROR: 'Error desconocido. Contacta al soporte.',
} as const;

export const SUCCESS_MESSAGES = {
  FEED_CREATED: 'Feed creado exitosamente',
  FEED_UPDATED: 'Feed actualizado exitosamente',
  FEED_DELETED: 'Feed eliminado exitosamente',
  KEYWORD_ADDED: 'Keyword agregada exitosamente',
  KEYWORD_REMOVED: 'Keyword eliminada exitosamente',
  SOURCE_ADDED: 'Fuente agregada exitosamente',
  SOURCE_REMOVED: 'Fuente eliminada exitosamente',
  FEED_SET_DEFAULT: 'Feed establecido como predeterminado',
} as const;

export const UI_CONSTANTS = {
  MAX_FEEDS_PER_USER: 5,
  MAX_KEYWORD_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  SIDEBAR_WIDTH: 280,
} as const;
