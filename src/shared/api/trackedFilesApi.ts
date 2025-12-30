import { API_BASE_URL } from '../constants';

export interface TrackedFile {
  id: number;
  sourceId: number;
  fileId: string;
  fileName: string;
  filePath: string;
  fileHash: string | null;
  lastModified: Date;
  lastProcessedAt: Date | null;
  isFolder: boolean;
  includeChildren: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage: string | null;
  chunksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const trackedFilesApi = {
  async trackFile(data: {
    sourceId: number;
    fileId: string;
    fileName: string;
    filePath: string;
    isFolder: boolean;
    includeChildren?: boolean;
  }): Promise<TrackedFile> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/tracked-files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al agregar archivo al tracking');
    }

    return response.json();
  },

  async untrackFile(sourceId: number, fileId: string): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/tracked-files/${sourceId}/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw new Error(error.error || 'Error al quitar archivo del tracking');
    }
  },

  async getTrackedFiles(sourceId: number): Promise<TrackedFile[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/tracked-files/${sourceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener archivos tracked');
    }

    return response.json();
  },

  async getTrackedFilesMap(sourceId: number): Promise<Record<string, TrackedFile>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/tracked-files/${sourceId}/map`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener mapa de archivos');
    }

    return response.json();
  },

  async unragFile(sourceId: number, fileId: string): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/tracked-files/${sourceId}/${fileId}/unrag`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al des-ragear archivo');
    }
  },
};

