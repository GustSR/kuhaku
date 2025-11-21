'use client';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const loadUserFromStorage = useCallback(async () => {
    const token = localStorage.getItem('kuhaku_token');
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      try {
        await api.get('/users/me'); // Valida o token e busca o usuário
        const storedUser = JSON.parse(localStorage.getItem('kuhaku_user'));
        setUser(storedUser);
      } catch (e) {
        signOut();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);
  
  const signIn = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('kuhaku_token', data.token);
      localStorage.setItem('kuhaku_user', JSON.stringify(data.user));
      api.defaults.headers.Authorization = `Bearer ${data.token}`;
      setUser(data.user);
      router.push('/dashboard');
    } catch (e) {
      const message =
        e.response?.data?.message || 'Failed to login. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('kuhaku_token');
    localStorage.removeItem('kuhaku_user');
    setUser(null);
    delete api.defaults.headers.Authorization;
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        signIn,
        signOut,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
