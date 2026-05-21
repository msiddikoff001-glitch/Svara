import { create } from 'zustand';

import { fetchCurrentUser } from '../api/user';
import { MOCK_USER } from '../data/mocks';
import type { User } from '../types/domain';

/**
 * authStore — current user + balance.
 *
 * Today the store is seeded with mock data so the UI can render without a
 * backend. When the API is wired up, `loadUser` will resolve a real
 * `User` object and balance mutations will become server-confirmed.
 *
 * Balance mutations are *optimistic*: `creditBalance` / `debitBalance`
 * apply the delta immediately and return a `rollback` function so the
 * caller can revert the change if the server rejects the operation.
 */
export type BalanceRollback = () => void;

export interface AuthStoreState {
  user: User;
  isLoading: boolean;
  error: unknown;
  loadUser: () => Promise<void>;
  clearError: () => void;
  creditBalance: (delta: number) => BalanceRollback;
  debitBalance: (delta: number) => BalanceRollback;
}

const round2 = (value: number): number => parseFloat(value.toFixed(2));

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: MOCK_USER,
  isLoading: false,
  error: null,

  loadUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await fetchCurrentUser();
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error });
    }
  },

  clearError: () => set({ error: null }),

  creditBalance: (delta) => {
    const prevBalance = get().user.balance;
    set((state) => ({
      user: { ...state.user, balance: round2(state.user.balance + delta) },
    }));
    return () => set((state) => ({ user: { ...state.user, balance: prevBalance } }));
  },

  debitBalance: (delta) => {
    const prevBalance = get().user.balance;
    set((state) => ({
      user: { ...state.user, balance: round2(state.user.balance - delta) },
    }));
    return () => set((state) => ({ user: { ...state.user, balance: prevBalance } }));
  },
}));
