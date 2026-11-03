"use client";

import { create } from "zustand";

interface UserState {
  currency: string;
  symbol: string;
  balance: number;
  withdrawable: number;
  loaded: boolean;
  setCurrency: (currency: string, symbol: string) => void;
  setBalances: (balance: number, withdrawable: number) => void;
  deductBalance: (amount: number) => void;
  addWinnings: (amount: number) => void;
  addBalance: (amount: number) => void;
  reset: () => void;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  GHS: "GH₵",
  NGN: "₦",
  KES: "KSh",
  ZAR: "R",
  USD: "$",
  GBP: "£",
};

const DEFAULT_CURRENCY = "GHS";
const DEFAULT_SYMBOL = CURRENCY_SYMBOLS[DEFAULT_CURRENCY];

export const useUserStore = create<UserState>((set) => ({
  currency: DEFAULT_CURRENCY,
  symbol: DEFAULT_SYMBOL,
  balance: 0,
  withdrawable: 0,
  loaded: false,

  setCurrency: (currency, symbol) => set({ currency, symbol }),

  setBalances: (balance, withdrawable) =>
    set({
      balance: Number.isFinite(balance) ? Math.max(0, balance) : 0,
      withdrawable: Number.isFinite(withdrawable) ? Math.max(0, withdrawable) : 0,
      loaded: true,
    }),

  deductBalance: (amount) =>
    set((state) => ({
      balance: Math.max(0, state.balance - Math.max(0, amount)),
    })),

  addWinnings: (amount) =>
    set((state) => ({
      balance: state.balance + Math.max(0, amount),
      withdrawable: state.withdrawable + Math.max(0, amount),
    })),

  addBalance: (amount) =>
    set((state) => ({
      balance: state.balance + Math.max(0, amount),
    })),

  reset: () =>
    set({
      currency: DEFAULT_CURRENCY,
      symbol: DEFAULT_SYMBOL,
      balance: 0,
      withdrawable: 0,
      loaded: false,
    }),
}));