import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '../types';
import { serverLogout } from '../api/auth';

interface AuthState {
  token: string | null;
  user: Pick<AuthResponse, 'userId' | 'email' | 'phone' | 'displayName' | 'locale'> | null;
  setAuth: (res: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (res) => {
        if (res.token) localStorage.setItem('listy_token', res.token);
        set({
          token: res.token,
          user: {
            userId: res.userId,
            email: res.email,
            phone: res.phone,
            displayName: res.displayName,
            locale: res.locale,
          },
        });
      },
      logout: () => {
        // Revoke refresh token on server (clears HttpOnly cookie)
        serverLogout();
        localStorage.removeItem('listy_token');
        set({ token: null, user: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: 'listy-auth' }
  )
);
