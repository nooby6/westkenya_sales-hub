const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const getToken = (): string | null => {
  return localStorage.getItem('api_access_token') || import.meta.env.VITE_API_ACCESS_TOKEN || null;
};

export const setApiAccessToken = (token: string) => {
  localStorage.setItem('api_access_token', token);
};

export const clearApiAccessToken = () => {
  localStorage.removeItem('api_access_token');
};

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail || `Request failed with status ${response.status}`;
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export { ApiError };
