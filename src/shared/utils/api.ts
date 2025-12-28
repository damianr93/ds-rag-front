import { getToken } from "../../shared/utils/storageToken";

// URL base del API - configurable desde .env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  const fullUrl = `${API_BASE_URL}${path}`;

  let body: string | undefined;
  if (options.body) {
    try {
      body = JSON.stringify(options.body);
    } catch (error) {
      console.error('Error serializando body:', error);
      throw new Error('Error al serializar los datos para enviar');
    }
  }

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
}
