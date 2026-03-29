import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthState {
  token: string | null;
  username: string | null;
  userId: number | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, username: string, userId: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username'),
    userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  }));

  function login(token: string, username: string, userId: number) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', String(userId));
    setState({ token, username, userId });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setState({ token: null, username: null, userId: null });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
