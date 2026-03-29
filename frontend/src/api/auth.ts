import api from './client';

export interface AuthResponse {
  token: string;
  username: string;
  userId: number;
}

export const register = (username: string, email: string, password: string) =>
  api.post<AuthResponse>('/api/auth/register', { username, email, password });

export const login = (username: string, password: string) =>
  api.post<AuthResponse>('/api/auth/login', { username, password });
