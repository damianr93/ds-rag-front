import { createAsyncThunk } from '@reduxjs/toolkit';
import type { User } from '../../../shared/types';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../../../shared/constants';
import { api, auth } from '../../../shared/utils';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: ERROR_MESSAGES.AUTH_ERROR }));
        throw new Error(error.message || ERROR_MESSAGES.AUTH_ERROR);
      }

      const responseData = await api.handleResponse<{ success: boolean; data: AuthResponse; message: string }>(response);
      
      // Extraer los datos del formato de respuesta del backend
      const { user, token } = responseData.data;
      
      // Guardar en localStorage
      auth.setToken(token);
      auth.setUser(user);
      
      return { user, token };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: ERROR_MESSAGES.AUTH_ERROR }));
        throw new Error(error.message || ERROR_MESSAGES.AUTH_ERROR);
      }

      const responseData = await api.handleResponse<{ success: boolean; data: AuthResponse; message: string }>(response);
      
      // Extraer los datos del formato de respuesta del backend
      const { user, token } = responseData.data;
      
      // Guardar en localStorage
      auth.setToken(token);
      auth.setUser(user);
      
      return { user, token };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const token = auth.getToken();
      if (token) {
        await fetch(API_ENDPOINTS.LOGOUT, {
          method: 'POST',
          headers: api.getHeaders(token)
        });
      }
      
      // Limpiar localStorage
      auth.logout();
      
      return null;
    } catch (error) {
      // Aunque falle la petición, limpiar el estado local
      auth.logout();
      return rejectWithValue(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error(ERROR_MESSAGES.AUTH_ERROR);
      }

      const response = await fetch(API_ENDPOINTS.PROFILE, {
        headers: api.getHeaders(token)
      });

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.AUTH_ERROR);
      }

      const responseData = await api.handleResponse<{ success: boolean; data: { user: User }; message: string }>(response);
      
      // Extraer el usuario del formato de respuesta del backend
      const user = responseData.data.user;
      
      // Actualizar usuario en localStorage
      auth.setUser(user);
      
      return user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }
);
