import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types';

import { api, tokenStorage } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = tokenStorage.get();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const userData = await api.auth.getMe();
        setUser(userData);
        setToken(storedToken);
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        tokenStorage.remove();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const res = await api.auth.login(credentials);
    tokenStorage.set(res.token);
    setToken(res.token);
    const userObj: User = {
      id: res.id,
      username: res.username,
      email: res.email,
      fullName: res.fullName || res.username,
      role: res.role,
    };
    setUser(userObj);
    setIsAuthModalOpen(false);
  };

  const register = async (data: RegisterRequest) => {
    const res = await api.auth.register(data);
    tokenStorage.set(res.token);
    setToken(res.token);
    const userObj: User = {
      id: res.id,
      username: res.username,
      email: res.email,
      fullName: res.fullName || res.username,
      role: res.role,
    };
    setUser(userObj);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    tokenStorage.remove();
    setToken(null);
    setUser(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthModalOpen,
        login,
        register,
        logout,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
