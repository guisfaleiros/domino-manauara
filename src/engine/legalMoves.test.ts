import { describe, it, expect } from 'vitest';
import type { GameState, PlacedPiece } from './types';
import {
  activeArms,
  activeArmsForScore,
  sumEnds,
  getPlayable,
  matchArms,
} from './legalMoves';

// ─── helper ──────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<GameState>): GameState {
  return {
    limit: 100,
    scoreA: 0,
    scoreB: 0,
    round: 1,
    hands: { south: [], west: [], north: [], east: [] },
    board: [],
    ends: { left: null, right: null, top: null, bottom: null },
    arms: { left: 0, right: 0, top: 0, bottom: 0 },
    current: 'south',
    passChain: [],
    galo: null,
    galoPhase: 0,
    lastWinner: null,
    batida: null,
    isFirstPlay: true,
    over: false,
    ...overrides,
  };
}

const CENTER_66: PlacedPiece = { a: 6, b: 6, isCarroca: true, arm: 'center', freeVal: 6 };
const CENTER_55: PlacedPiece = { a: 5, b: 5, isCarroca: true, arm: 'center', freeVal: 5 };

// ─── activeArms ───────────────────────────────────────────────────────────────

describe('activeArms', () => {
  it('tabuleiro vazio → sem braços (primeira peça vai para center)', () => {
    expect(activeArms(makeState({}))).toEqual([]);
  });

  it('só carroça central → apenas right (segunda peça obrigatória)', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 6, right: 6, top: 6, bottom: 6 },
    });
    expect(activeArms(state)).toEqual(['right']);
  });

  it('right tem peça, left não → right e left disponíveis', () => {
    const state = makeState({
      board: [CENTER_66, { a: 6, b: 3, isCarroca: false, arm: 'right', freeVal: 3 }],
      ends: { left: 6, right: 3, top: 6, bottom: 6 },
      arms: { left: 0, right: 1, top: 0, bottom: 0 },
    });
    const arms = activeArms(state);
    expect(arms).toContain('right');
    expect(arms).toContain('left');
    expect(arms).not.toContain('top');
    expect(arms).not.toContain('bottom');
  });

  it('ambos horizontais têm peças → todos os quatro braços abertos', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 4, right: 3, top: 6, bottom: 6 },
      arms: { left: 1, right: 1, top: 0, bottom: 0 },
    });
    const arms = activeArms(state);
    expect(arms).toContain('left');
    expect(arms).toContain('right');
    expect(arms).toContain('top');
    expect(arms).toContain('bottom');
  });

  it('top/bottom NÃO abrem se apenas um horizontal tem peça', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 6, right: 3, top: 6, bottom: 6 },
      arms: { left: 0, right: 1, top: 0, bottom: 0 },
    });
    const arms = activeArms(state);
    expect(arms).not.toContain('top');
    expect(arms).not.toContain('bottom');
  });
});

// ─── activeArmsForScore ───────────────────────────────────────────────────────

describe('activeArmsForScore', () => {
  it('tabuleiro vazio → []', () => {
    expect(activeArmsForScore(makeState({}))).toEqual([]);
  });

  it('só carroça central (nenhum braço) → [] (sumEnds trata separado)', () => {
    const state = makeState({ board: [CENTER_66] });
    expect(activeArmsForScore(state)).toEqual([]);
  });

  it('right tem peça, left não → [right, left] (center age como ponta left)', () => {
    const state = makeState({ arms: { left: 0, right: 1, top: 0, bottom: 0 } });
    const arms = activeArmsForScore(state);
    expect(arms).toContain('right');
    expect(arms).toContain('left');
  });

  it('left tem peça, right não → [left, right] (center age como ponta right)', () => {
    const state = makeState({ arms: { left: 1, right: 0, top: 0, bottom: 0 } });
    const arms = activeArmsForScore(state);
    expect(arms).toContain('left');
    expect(arms).toContain('right');
  });

  it('ambos horizontais → só left e right (sem top/bottom)', () => {
    const state = makeState({ arms: { left: 1, right: 1, top: 0, bottom: 0 } });
    const arms = activeArmsForScore(state);
    expect(arms).toContain('left');
    expect(arms).toContain('right');
    expect(arms).not.toContain('top');
    expect(arms).not.toContain('bottom');
  });

  it('todos os braços com peças → [left, right, top, bottom]', () => {
    const state = makeState({ arms: { left: 1, right: 1, top: 1, bottom: 1 } });
    const arms = activeArmsForScore(state);
    expect(arms).toHaveLength(4);
  });
});

// ─── sumEnds ─────────────────────────────────────────────────────────────────

describe('sumEnds', () => {
  it('tabuleiro vazio → 0', () => {
    expect(sumEnds(makeState({}))).toBe(0);
  });

  it('só carroça central [5:5] → 10 (5×2, dois lados expostos)', () => {
    const state = makeState({ board: [CENTER_55] });
    expect(sumEnds(state)).toBe(10);
  });

  it('só carroça central [6:6] → 12', () => {
    const state = makeState({ board: [CENTER_66] });
    expect(sumEnds(state)).toBe(12);
  });

  it('center [6:6] + right ponta=3 (não carroça) → 12 + 3 = 15', () => {
    // center age como ponta left (isCarroca=true → 6×2=12), right=3
    const rightPiece: PlacedPiece = { a: 6, b: 3, isCarroca: false, arm: 'right', freeVal: 3 };
    const state = makeState({
      board: [CENTER_66, rightPiece],
      ends: { left: 6, right: 3, top: 6, bottom: 6 },
      arms: { left: 0, right: 1, top: 0, bottom: 0 },
    });
    expect(sumEnds(state)).toBe(15);
  });

  it('ambos horizontais preenchidos, pontas 4 e 3 (sem carroça) → 7', () => {
    const leftPiece: PlacedPiece  = { a: 6, b: 4, isCarroca: false, arm: 'left',  freeVal: 4 };
    const rightPiece: PlacedPiece = { a: 6, b: 3, isCarroca: false, arm: 'right', freeVal: 3 };
    const state = makeState({
      board: [CENTER_66, rightPiece, leftPiece],
      ends: { left: 4, right: 3, top: null, bottom: null },
      arms: { left: 1, right: 1, top: 0, bottom: 0 },
    });
    expect(sumEnds(state)).toBe(7);
  });

  it('ponta de braço é carroça [3:3] → conta em dobro (3×2=6)', () => {
    // left ponta=3 com carroça, right ponta=4 sem carroça → 6+4=10
    const leftCarroca: PlacedPiece = { a: 3, b: 3, isCarroca: true, arm: 'left', freeVal: 3 };
    const state = makeState({
      board: [CENTER_66, leftCarroca],
      ends: { left: 3, right: 4, top: null, bottom: null },
      arms: { left: 1, right: 1, top: 0, bottom: 0 },
    });
    expect(sumEnds(state)).toBe(10);
  });

  it('pontas que não somam múltiplo de 5 → valor correto mesmo assim', () => {
    // sumEnds só soma — quem decide se pontua é o play.ts
    const leftPiece: PlacedPiece  = { a: 6, b: 3, isCarroca: false, arm: 'left',  freeVal: 3 };
    const rightPiece: PlacedPiece = { a: 6, b: 4, isCarroca: false, arm: 'right', freeVal: 4 };
    const state = makeState({
      board: [CENTER_66, rightPiece, leftPiece],
      ends: { left: 3, right: 4, top: null, bottom: null },
      arms: { left: 1, right: 1, top: 0, bottom: 0 },
    });
    expect(sumEnds(state)).toBe(7);
  });
});

// ─── getPlayable ──────────────────────────────────────────────────────────────

describe('getPlayable', () => {
  it('tabuleiro vazio + isFirstPlay → só [6:6]', () => {
    const state = makeState({
      hands: {
        south: [{ a: 6, b: 6 }, { a: 5, b: 5 }, { a: 3, b: 2 }],
        west: [], north: [], east: [],
      },
      isFirstPlay: true,
    });
    expect(getPlayable(state, 'south')).toEqual([{ a: 6, b: 6 }]);
  });

  it('tabuleiro vazio + isFirstPlay + sem [6:6] → []', () => {
    const state = makeState({
      hands: { south: [{ a: 5, b: 5 }, { a: 3, b: 2 }], west: [], north: [], east: [] },
      isFirstPlay: true,
    });
    expect(getPlayable(state, 'south')).toEqual([]);
  });

  it('tabuleiro vazio + !isFirstPlay → qualquer carroça', () => {
    const state = makeState({
      hands: {
        south: [{ a: 5, b: 5 }, { a: 3, b: 2 }, { a: 4, b: 4 }],
        west: [], north: [], east: [],
      },
      isFirstPlay: false,
    });
    const playable = getPlayable(state, 'south');
    expect(playable).toHaveLength(2);
    expect(playable).toContainEqual({ a: 5, b: 5 });
    expect(playable).toContainEqual({ a: 4, b: 4 });
  });

  it('tabuleiro com pontas 3 e 5 → peças que casam com 3 ou 5', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 3, right: 5, top: null, bottom: null },
      arms: { left: 1, right: 1, top: 0, bottom: 0 },
      hands: {
        south: [{ a: 3, b: 1 }, { a: 5, b: 2 }, { a: 2, b: 4 }, { a: 3, b: 5 }],
        west: [], north: [], east: [],
      },
    });
    const playable = getPlayable(state, 'south');
    expect(playable).toContainEqual({ a: 3, b: 1 });
    expect(playable).toContainEqual({ a: 5, b: 2 });
    expect(playable).toContainEqual({ a: 3, b: 5 });
    expect(playable).not.toContainEqual({ a: 2, b: 4 });
  });

  it('nenhuma peça casa → [] (jogador deve passar)', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 3, right: 5, top: null, bottom: null },
      arms: { left: 1, right: 1, top: 0, bottom: 0 },
      hands: {
        south: [{ a: 1, b: 2 }, { a: 0, b: 4 }],
        west: [], north: [], east: [],
      },
    });
    expect(getPlayable(state, 'south')).toEqual([]);
  });
});

// ─── matchArms ───────────────────────────────────────────────────────────────

describe('matchArms', () => {
  it('tabuleiro vazio → [] (vai para center, sem escolha)', () => {
    expect(matchArms(makeState({}), { a: 6, b: 6 })).toEqual([]);
  });

  it('peça casa só com right (ponta 5) → [right]', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 6, right: 5, top: 6, bottom: 6 },
      arms: { left: 0, right: 1, top: 0, bottom: 0 },
    });
    expect(matchArms(state, { a: 5, b: 2 })).toContain('right');
    expect(matchArms(state, { a: 5, b: 2 })).not.toContain('top');
  });

  it('carroça [5:5] casa com right E left quando ambas as pontas são 5', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 5, right: 5, top: null, bottom: null },
      arms: { left: 1, right: 1, top: 0, bottom: 0 },
    });
    const arms = matchArms(state, { a: 5, b: 5 });
    expect(arms).toContain('left');
    expect(arms).toContain('right');
  });

  it('peça não casa com nenhuma ponta → []', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 3, right: 4, top: null, bottom: null },
      arms: { left: 1, right: 1, top: 0, bottom: 0 },
    });
    expect(matchArms(state, { a: 1, b: 2 })).toEqual([]);
  });
});
