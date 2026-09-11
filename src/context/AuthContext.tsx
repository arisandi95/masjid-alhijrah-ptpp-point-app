import React, { createContext, useContext, useEffect, useState } from 'react';
import { JenisKelamin, StatusJamaah, User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (no_hp: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    nama: string,
    no_hp: string,
    pin: string,
    role?: 'user' | 'admin',
    details?: {
      email?: string;
      tanggal_lahir?: string;
      jenis_kelamin?: JenisKelamin;
      status_jamaah?: StatusJamaah;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUserPoints: (newTotalPoin: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'alhijrah_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed: User = JSON.parse(saved);
        if (!parsed.role) {
          const isAdminRole =
            parsed.user_id === 'usr_admin_1' ||
            parsed.no_hp === '6289999999999' ||
            (parsed.nama && parsed.nama.toLowerCase().includes('admin'));
          parsed.role = isAdminRole ? 'admin' : 'user';
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        }
        setUser(parsed);
        // Silently refresh profile to get latest points and role
        api.getProfile(parsed.user_id).then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.data));
          }
        }).catch(() => {
          // keep saved if offline
        });
      }
    } catch (e) {
      console.error('Failed to parse auth session', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (no_hp: string, pin: string) => {
    try {
      const res = await api.login(no_hp, pin);
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.data));
        return { success: true };
      }
      return { success: false, error: res.error || 'Login gagal.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi gangguan koneksi.' };
    }
  };

  const register = async (
    nama: string,
    no_hp: string,
    pin: string,
    role: 'user' | 'admin' = 'user',
    details?: {
      email?: string;
      tanggal_lahir?: string;
      jenis_kelamin?: JenisKelamin;
      status_jamaah?: StatusJamaah;
    }
  ) => {
    try {
      const res = await api.register(nama, no_hp, pin, role, details);
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.data));
        return { success: true };
      }
      return { success: false, error: res.error || 'Pendaftaran gagal.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Terjadi gangguan koneksi.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const res = await api.getProfile(user.user_id);
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.data));
      }
    } catch (e) {
      console.warn('Could not refresh profile', e);
    }
  };

  const updateUserPoints = (newTotalPoin: number) => {
    if (!user) return;
    const updated = { ...user, total_poin: newTotalPoin };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        updateUserPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
