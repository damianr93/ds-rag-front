// Utilidades compartidas para toda la aplicación

import { STORAGE_KEYS, API_BASE_URL } from '../constants';

// Utilidades de almacenamiento
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Utilidades de autenticación
export const auth = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  },
  
  setToken: (token: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving token to localStorage:', error);
    }
  },
  
  removeToken: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing token from localStorage:', error);
    }
  },
  
  getUser: () => {
    return storage.get(STORAGE_KEYS.USER_DATA);
  },
  
  setUser: (user: any): void => {
    storage.set(STORAGE_KEYS.USER_DATA, user);
  },
  
  removeUser: (): void => {
    storage.remove(STORAGE_KEYS.USER_DATA);
  },
  
  logout: (): void => {
    auth.removeToken();
    auth.removeUser();
  }
};

// Utilidades de formato
export const format = {
  date: (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  timeAgo: (date: string | Date): string => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    
    return format.date(date);
  },
  
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },
  
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
};

// Utilidades de validación
export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  required: (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  },
  
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },
  
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  }
};

// Utilidades de API
export const api = {
  buildUrl: (endpoint: string, params?: Record<string, any>): string => {
    const url = new URL(endpoint, API_BASE_URL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  },
  
  getHeaders: (token?: string | null): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  },
  
  handleResponse: async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error del servidor' }));
      throw new Error(error.message || 'Error del servidor');
    }
    
    return response.json();
  }
};

// Utilidades de debounce
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Utilidades de arrays
export const arrays = {
  unique: <T>(array: T[], key?: keyof T): T[] => {
    if (!key) return [...new Set(array)];
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },
  
  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      if (!groups[value]) groups[value] = [];
      groups[value].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },
  
  sortBy: <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
};

// Utilidades de objetos
export const objects = {
  pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },
  
  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },
  
  isEmpty: (obj: any): boolean => {
    if (obj == null) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj as object).length === 0;
    return false;
  }
};

