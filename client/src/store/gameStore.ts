import { create } from 'zustand';
import type { GameMode, InputType, PhysicsPhase, Card, UserCard, User } from '../types';

interface GameState {
  // Identity
  mode: GameMode | null;
  setMode: (m: GameMode) => void;

  // Input
  inputType: InputType | null;
  inputContent: string;
  drawLabel: string;
  saveToCollection: boolean;
  setInput: (type: InputType, content: string, label?: string, saveToCollection?: boolean) => void;

  // Physics phase
  physicsPhase: PhysicsPhase;
  setPhysicsPhase: (p: PhysicsPhase) => void;

  // Gacha
  lastDrawCard: Card | null;
  lastDrawIsNew: boolean;
  setLastDraw: (card: Card | null, isNew: boolean) => void;

  // User
  user: User | null;
  setUser: (u: User | null) => void;

  // Collection
  collection: UserCard[];
  setCollection: (cards: UserCard[]) => void;
  addToCollection: (card: UserCard) => void;

  // DIY cards (drawings + crafted cards) — persisted in localStorage
  diyCards: UserCard[];
  addDiyCard: (card: UserCard) => void;
  removeDiyCard: (id: string) => void;
  loadDiyCards: () => void;

  // Crafting: track consumed card IDs for inventory deduction
  consumedCardIds: string[];
  consumeCards: (ids: string[]) => void;
  loadConsumedCards: () => void;

  // Current run ID (for saving)
  currentRunId: string | null;
  setCurrentRunId: (id: string | null) => void;

  // Reset for new cycle
  reset: () => void;
}

const DIY_STORAGE_KEY = 'crazy_diy_cards';
const CONSUMED_KEY = 'crazy_consumed_cards';

function loadDiyFromStorage(): UserCard[] {
  try {
    const raw = localStorage.getItem(DIY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDiyToStorage(cards: UserCard[]) {
  try { localStorage.setItem(DIY_STORAGE_KEY, JSON.stringify(cards)); } catch {}
}

function loadConsumedFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(CONSUMED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConsumedToStorage(ids: string[]) {
  try { localStorage.setItem(CONSUMED_KEY, JSON.stringify(ids)); } catch {}
}

export const useGameStore = create<GameState>((set) => ({
  mode: null,
  setMode: (mode) => set({ mode }),

  inputType: null,
  inputContent: '',
  drawLabel: '',
  saveToCollection: true,
  setInput: (inputType, inputContent, drawLabel, saveToCollection = true) =>
    set({ inputType, inputContent, drawLabel: drawLabel || '', saveToCollection }),

  physicsPhase: 'idle',
  setPhysicsPhase: (physicsPhase) => set({ physicsPhase }),

  lastDrawCard: null,
  lastDrawIsNew: false,
  setLastDraw: (lastDrawCard, lastDrawIsNew) => set({ lastDrawCard, lastDrawIsNew }),

  user: null,
  setUser: (user) => set({ user }),

  collection: [],
  setCollection: (collection) => set({ collection }),
  addToCollection: (userCard) =>
    set((state) => ({ collection: [...state.collection, userCard] })),

  diyCards: loadDiyFromStorage(),
  addDiyCard: (diyCard) =>
    set((state) => {
      const updated = [...state.diyCards, diyCard];
      saveDiyToStorage(updated);
      return { diyCards: updated };
    }),
  removeDiyCard: (id) =>
    set((state) => {
      const updated = state.diyCards.filter(c => c.id !== id && c.cardId !== id);
      saveDiyToStorage(updated);
      return { diyCards: updated };
    }),
  loadDiyCards: () => set({ diyCards: loadDiyFromStorage() }),

  consumedCardIds: loadConsumedFromStorage(),
  consumeCards: (ids) =>
    set((state) => {
      const updated = [...new Set([...state.consumedCardIds, ...ids])];
      saveConsumedToStorage(updated);
      return { consumedCardIds: updated };
    }),
  loadConsumedCards: () => set({ consumedCardIds: loadConsumedFromStorage() }),

  currentRunId: null,
  setCurrentRunId: (currentRunId) => set({ currentRunId }),

  reset: () =>
    set({
      inputType: null,
      inputContent: '',
      drawLabel: '',
      physicsPhase: 'idle',
      lastDrawCard: null,
      lastDrawIsNew: false,
      currentRunId: null,
    }),
}));
