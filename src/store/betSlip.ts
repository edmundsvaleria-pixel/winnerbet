"use client";

import { create } from "zustand";

export type BetSelection = {
  matchId: number;
  matchLabel: string;
  league: string;
  market: string;
  pick: string;
  odd: number;
};

interface BetSlipState {
  selections: BetSelection[];
  isOpen: boolean;
  addSelection: (selection: BetSelection) => void;
  removeSelection: (matchId: number, market: string) => void;
  isSelected: (matchId: number, market: string, pick: string) => boolean;
  openSlip: () => void;
  closeSlip: () => void;
  toggleSlip: () => void;
  clearSlip: () => void;
  totalOdds: () => number;
}

export const useBetSlipStore = create<BetSlipState>((set, get) => ({
  selections: [],
  isOpen: false,

  addSelection: (selection) =>
    set((state) => {
      const existingIndex = state.selections.findIndex(
        (s) => s.matchId === selection.matchId && s.market === selection.market
      );

      // If same market+pick, remove it (toggle off)
      if (existingIndex >= 0 && state.selections[existingIndex].pick === selection.pick) {
        return { selections: state.selections.filter((_, i) => i !== existingIndex) };
      }

      // If same market but different pick, replace it
      if (existingIndex >= 0) {
        const newSelections = [...state.selections];
        newSelections[existingIndex] = selection;
        return { selections: newSelections };
      }

      // Otherwise, add as a new selection (allows multiple markets for same match)
      return { selections: [...state.selections, selection] };
    }),

  removeSelection: (matchId, market) =>
    set((state) => ({
      selections: state.selections.filter(
        (s) => !(s.matchId === matchId && s.market === market)
      ),
    })),

  isSelected: (matchId, market, pick) =>
    get().selections.some(
      (s) => s.matchId === matchId && s.market === market && s.pick === pick
    ),

  openSlip: () => set({ isOpen: true }),
  closeSlip: () => set({ isOpen: false }),
  toggleSlip: () => set((state) => ({ isOpen: !state.isOpen })),

  clearSlip: () => set({ selections: [] }),

  totalOdds: () =>
    get().selections.reduce((acc, s) => acc * (s.odd || 1), 1),
}));