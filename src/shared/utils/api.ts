import { getToken } from "../../shared/utils/storageToken";
import { API_CONFIG } from "../config/api";

// URL base del API - usar la configuración centralizada
const API_BASE_URL = API_CONFIG.baseURL;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiFetch<T = any>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    auth?: boolean;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Asegurar que el path empiece con /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${API_BASE_URL}${cleanPath}`;

  let body: string | undefined;
  if (options.body) {
    try {
      body = JSON.stringify(options.body);
    } catch (error) {
      console.error('Error serializando body:', error);
      throw new Error('Error al serializar los datos para enviar');
    }
  }

  try {
    const res = await fetch(fullUrl, {
      method: options.method ?? "GET",
      headers,
      body,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      const message =
        data?.message || data?.error || `HTTP ${res.status} ${res.statusText}`;
      throw new Error(message);
    }
    return data as T;
  } catch (error: any) {
    // Mejorar mensajes de error de red
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network Error:', {
        url: fullUrl,
        apiBaseUrl: API_BASE_URL,
        envVar: import.meta.env.VITE_API_URL,
      });
      throw new Error(
        `No se pudo conectar con el servidor. Verifica que VITE_API_URL esté configurada correctamente. URL intentada: ${fullUrl}`
      );
    }
    throw error;
  }
}
