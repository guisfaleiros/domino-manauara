import type { Piece, PipValue, Hands } from './types';
import { PLAYER_ORDER } from './types';

/** Gera as 28 peças do dominó (a <= b sempre). */
export function mkDeck(): Piece[] {
  const deck: Piece[] = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      deck.push({ a: a as PipValue, b: b as PipValue });
    }
  }
  return deck;
}

/** Retorna uma cópia embaralhada do deck (Fisher-Yates). */
export function shuffle(deck: Piece[]): Piece[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Distribui 7 peças para cada jogador a partir de um deck embaralhado. */
export function deal(deck: Piece[]): Hands {
  return {
    south: deck.slice(0, 7),
    west:  deck.slice(7, 14),
    north: deck.slice(14, 21),
    east:  deck.slice(21, 28),
  };
}

/** Encontra o jogador que tem a peça [6:6]. */
export function findPlayer66(hands: Hands): keyof Hands | null {
  for (const player of PLAYER_ORDER) {
    if (hands[player].some(p => p.a === 6 && p.b === 6)) return player;
  }
  return null;
}

/** Retorna as carroças de um jogador (peças com a === b). */
export function getCarrocas(pieces: readonly Piece[]): Piece[] {
  return pieces.filter(p => p.a === p.b);
}
