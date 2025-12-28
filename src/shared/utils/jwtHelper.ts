/**
 * Decodifica un JWT y extrae el payload
 * IMPORTANTE: Esto NO valida la firma, solo decodifica el contenido
 * La validación de seguridad se hace en el backend
 */
export function decodeJWT<T = any>(token: string): T | null {
  try {
    // Un JWT tiene 3 partes separadas por punto: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // El payload es la segunda parte (index 1)
    const payload = parts[1];
    
    // Decodificar de base64url a string
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as T;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Obtiene el rol del usuario desde el JWT almacenado
 */
export function getUserRoleFromToken(): string | null {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    const payload = decodeJWT<JWTPayload>(token);
    return payload?.role || null;
  } catch (error) {
    console.error('Error getting user role from token:', error);
    return null;
  }
}

/**
 * Verifica si el usuario actual es admin desde el JWT
 */
export function isUserAdmin(): boolean {
  const role = getUserRoleFromToken();
  return role === 'ADMIN';
}

