// Simplified store for UI state only - data comes from API
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'seller' | 'courier' | 'customer' | null;

export interface UserProfile {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
}

interface AppState {
  userRole: UserRole;
  profile: UserProfile | null;
  setRole: (role: UserRole) => void;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      userRole: null,
      profile: null,
      setRole: (role) => set({ userRole: role }),
      setProfile: (profile) => set({ profile, userRole: profile.role }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),
      logout: () => set({ userRole: null, profile: null }),
    }),
    {
      name: 'kolisa-user-storage',
    }
  )
);
