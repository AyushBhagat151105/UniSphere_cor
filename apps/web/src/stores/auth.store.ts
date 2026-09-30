import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { meResponseSchema } from '@UniSphere_cor/schemas';
import { z } from 'zod';

type User = z.infer<typeof meResponseSchema>;

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'auth-storage', // name of item in the storage (must be unique)
    }
  )
);
