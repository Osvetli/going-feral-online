export type GameMode = 'workplace' | 'academic';
export type InputType = 'text' | 'draw';
export type Rarity = 'SSR' | 'SR' | 'R' | 'N';
export type PhysicsPhase = 'idle' | 'cooking' | 'exploding' | 'smashing' | 'done';

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  mode: GameMode;
  description: string;
  emoji: string;
  imageData?: string | null;
  isDIY?: boolean;
}

export interface UserCard {
  id: string;
  userId: string;
  cardId: string;
  card: Card;
  runId?: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  nickname: string;
  createdAt?: string;
}

export interface Run {
  id: string;
  userId: string;
  mode: GameMode;
  inputType: InputType;
  content: string;
  drawLabel?: string | null;
  resultCard?: string | null;
  createdAt: string;
}

export interface ShareData {
  share: { id: string; createdAt: string };
  user: { nickname: string } | null;
  run: {
    mode: string;
    inputType: string;
    content: string;
    drawLabel?: string | null;
    createdAt: string;
  } | null;
  card: { name: string; rarity: string; emoji: string; description: string } | null;
}

export interface CollectionStats {
  totalUnique: number;
  totalCards: number;
  workplace: { collected: number; total: number; complete: boolean };
  academic: { collected: number; total: number; complete: boolean };
  byRarity: Record<string, number>;
}
