import { describe, it, expect } from 'vitest';
import type { GameState, PlacedPiece } from './types';
import { applyMove } from './play';

// ─── helper ──────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<GameState>): GameState {
  return {
    limit: 100, scoreA: 0, scoreB: 0, round: 1,
    hands: { south: [], west: [], north: [], east: [] },
    board: [],
    ends: { left: null, right: null, top: null, bottom: null },
    arms: { left: 0, right: 0, top: 0, bottom: 0 },
    current: 'south', passChain: [],
    galo: null, galoPhase: 0,
    lastWinner: null, batida: null,
    isFirstPlay: true, over: false,
    ...overrides,
  };
}

const CENTER_66: PlacedPiece = { a: 6, b: 6, isCarroca: true, arm: 'center', freeVal: 6 };

// ─── applyMove — play ─────────────────────────────────────────────────────────

describe('applyMove: play — primeira peça da rodada', () => {
  it('coloca a peça no center, define todos os ends e marca batida', () => {
    const state = makeState({
      hands: { south: [{ a: 6, b: 6 }], west: [], north: [], east: [] },
      current: 'south',
    });
    const next = applyMove(state, 'south', { type: 'play', piece: { a: 6, b: 6 }, arm: 'right' });

    expect(next.board[0]?.arm).toBe('center');
    expect(next.ends.left).toBe(6);
    expect(next.ends.right).toBe(6);
    expect(next.batida).toBe('south');
    expect(next.isFirstPlay).toBe(false);
    expect(next.hands.south).toHaveLength(0);
  });

  it('avança para o próximo jogador (west)', () => {
    const state = makeState({
      hands: {
        south: [{ a: 6, b: 6 }, { a: 3, b: 2 }],
        west:  [{ a: 6, b: 2 }],
        north: [{ a: 6, b: 1 }],
        east:  [{ a: 6, b: 0 }],
      },
      current: 'south',
    });
    const next = applyMove(state, 'south', { type: 'play', piece: { a: 6, b: 6 }, arm: 'right' });
    expect(next.current).toBe('west');
  });

  it('segunda peça vai para right, ends.right atualizado', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 6, right: 6, top: 6, bottom: 6 },
      arms: { left: 0, right: 0, top: 0, bottom: 0 },
      hands: { south: [], west: [{ a: 6, b: 3 }], north: [], east: [] },
      current: 'west', isFirstPlay: false,
    });
    const next = applyMove(state, 'west', { type: 'play', piece: { a: 6, b: 3 }, arm: 'right' });

    expect(next.arms.right).toBe(1);
    expect(next.ends.right).toBe(3); // freeVal = 3
    expect(next.board).toHaveLength(2);
  });

  it('carroça colocada no braço não muda o end', () => {
    // center [5:5] → right [5:5]: ponta right ainda é 5
    const center55: PlacedPiece = { a: 5, b: 5, isCarroca: true, arm: 'center', freeVal: 5 };
    const state = makeState({
      board: [center55],
      ends: { left: 5, right: 5, top: 5, bottom: 5 },
      arms: { left: 0, right: 0, top: 0, bottom: 0 },
      hands: { south: [], west: [{ a: 5, b: 5 }], north: [], east: [] },
      current: 'west', isFirstPlay: false,
    });
    const next = applyMove(state, 'west', { type: 'play', piece: { a: 5, b: 5 }, arm: 'right' });
    expect(next.ends.right).toBe(5);
    expect(next.arms.right).toBe(1);
  });
});

describe('applyMove: play — pontuação', () => {
  it('jogada que resulta em sumEnds=15 marca +15 na dupla do jogador', () => {
    // center [6:6] + right [6:3]: ponta right=3, left proxy=6 (carroça) → 3 + 6×2 = 15
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 6, right: 6, top: 6, bottom: 6 },
      arms: { left: 0, right: 0, top: 0, bottom: 0 },
      hands: { south: [], west: [{ a: 6, b: 3 }], north: [], east: [] },
      current: 'west', isFirstPlay: false, scoreA: 0, scoreB: 0,
    });
    const next = applyMove(state, 'west', { type: 'play', piece: { a: 6, b: 3 }, arm: 'right' });
    // west é Dupla B
    expect(next.scoreB).toBe(15);
    expect(next.scoreA).toBe(0);
  });

  it('jogada que resulta em soma não múltipla de 5 não marca', () => {
    const rightPiece: PlacedPiece = { a: 6, b: 3, isCarroca: false, arm: 'right', freeVal: 3 };
    const state = makeState({
      board: [CENTER_66, rightPiece],
      ends: { left: 6, right: 3, top: 6, bottom: 6 },
      arms: { left: 0, right: 1, top: 0, bottom: 0 },
      hands: { south: [{ a: 3, b: 4 }], west: [], north: [], east: [] },
      current: 'south', isFirstPlay: false,
    });
    // Joga [3:4] no left: freeVal=4, left ponta=4, right ponta=3 → 4+3=7 (não pontua)
    const next = applyMove(state, 'south', { type: 'play', piece: { a: 3, b: 4 }, arm: 'left' });
    expect(next.scoreA).toBe(0);
    expect(next.scoreB).toBe(0);
  });
});

describe('applyMove: play — fim de rodada', () => {
  it('mão vazia → over=true, current=null', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 6, right: 6, top: 6, bottom: 6 },
      arms: { left: 0, right: 0, top: 0, bottom: 0 },
      hands: { south: [{ a: 6, b: 3 }], west: [], north: [], east: [] },
      current: 'south', isFirstPlay: false,
    });
    const next = applyMove(state, 'south', { type: 'play', piece: { a: 6, b: 3 }, arm: 'right' });
    expect(next.over).toBe(true);
    expect(next.current).toBeNull();
  });
});

// ─── applyMove — pass ─────────────────────────────────────────────────────────

// Estado base para testes de passe: ninguém bloqueado (todos têm peça jogável)
const RIGHT_PIECE: PlacedPiece = { a: 6, b: 4, isCarroca: false, arm: 'right', freeVal: 4 };
function passBase(overrides: Partial<GameState>): GameState {
  return makeState({
    board: [CENTER_66, RIGHT_PIECE],
    ends: { left: 6, right: 4, top: null, bottom: null },
    arms: { left: 0, right: 1, top: 0, bottom: 0 },
    hands: {
      south: [{ a: 4, b: 1 }],
      west:  [{ a: 6, b: 2 }],
      north: [{ a: 4, b: 3 }],
      east:  [{ a: 6, b: 5 }],
    },
    isFirstPlay: false,
    ...overrides,
  });
}

describe('applyMove: pass', () => {
  it('primeiro passe → dupla adversária do passador ganha +20', () => {
    // west (Dupla B) passa → Dupla A ganha +20
    const state = passBase({ current: 'west' });
    const next = applyMove(state, 'west', { type: 'pass' });
    expect(next.scoreA).toBe(20);
    expect(next.scoreB).toBe(0);
    expect(next.passChain).toEqual(['west']);
    expect(next.current).toBe('north');
  });

  it('segundo passe (nas costas) → sem pontos', () => {
    const state = passBase({ current: 'north', passChain: ['west'] });
    const next = applyMove(state, 'north', { type: 'pass' });
    expect(next.scoreA).toBe(0);
    expect(next.scoreB).toBe(0);
    expect(next.passChain).toEqual(['west', 'north']);
  });

  it('terceiro passe sem galo → passChain resetado, volta para quem jogou', () => {
    const state = passBase({ current: 'east', passChain: ['west', 'north'] });
    const next = applyMove(state, 'east', { type: 'pass' });
    expect(next.passChain).toHaveLength(0);
    expect(next.current).toBe('south'); // south é o único que não passou
    expect(next.over).toBe(false);
  });

  it('terceiro passe com galo → +50 para dupla do anunciante', () => {
    // south (Dupla A) anunciou e jogou → west+north+east passam → galo confirmado
    const state = passBase({
      current: 'east', passChain: ['west', 'north'],
      galo: 'south', galoPhase: 2,
    });
    const next = applyMove(state, 'east', { type: 'pass' });
    expect(next.scoreA).toBe(50);
    expect(next.galo).toBeNull();
    expect(next.galoPhase).toBe(0);
  });

  it('batida transferida quando o portador passa', () => {
    const state = passBase({ current: 'south', batida: 'south', passChain: [] });
    const next = applyMove(state, 'south', { type: 'pass' });
    expect(next.batida).toBe('west');
  });
});

// ─── applyMove — galo ─────────────────────────────────────────────────────────

describe('applyMove: galo', () => {
  it('anuncia galo sem consumir a vez', () => {
    const state = makeState({ current: 'south', galo: null, galoPhase: 0 });
    const next = applyMove(state, 'south', { type: 'galo' });
    expect(next.galo).toBe('south');
    expect(next.galoPhase).toBe(1);
    expect(next.current).toBe('south'); // vez não avançou
  });

  it('após anunciar, jogar avança para galoPhase=2', () => {
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 6, right: 6, top: 6, bottom: 6 },
      arms: { left: 0, right: 0, top: 0, bottom: 0 },
      hands: { south: [{ a: 6, b: 3 }], west: [], north: [], east: [] },
      current: 'south', isFirstPlay: false,
      galo: 'south', galoPhase: 1,
    });
    const next = applyMove(state, 'south', { type: 'play', piece: { a: 6, b: 3 }, arm: 'right' });
    expect(next.galoPhase).toBe(2);
  });

  it('galo falso: outro jogador joga em galoPhase=2 → adversário do anunciante +50', () => {
    // south (Dupla A) anunciou. west (Dupla B) consegue jogar → galo falso
    // Adversário da Dupla A = Dupla B deve GANHAR 50 (eles são a dupla adversária da anunciante)
    const state = makeState({
      board: [CENTER_66],
      ends: { left: 6, right: 6, top: 6, bottom: 6 },
      arms: { left: 0, right: 0, top: 0, bottom: 0 },
      hands: { south: [], west: [{ a: 6, b: 2 }], north: [], east: [] },
      current: 'west', isFirstPlay: false,
      galo: 'south', galoPhase: 2,
    });
    const next = applyMove(state, 'west', { type: 'play', piece: { a: 6, b: 2 }, arm: 'right' });
    expect(next.scoreB).toBe(50); // Dupla B (adversária da anunciante A) ganha 50
    expect(next.galo).toBeNull();
    expect(next.galoPhase).toBe(0);
  });
});

// ─── guardrails ───────────────────────────────────────────────────────────────

describe('applyMove: guardrails', () => {
  it('lança erro se rodada já acabou', () => {
    const state = makeState({ over: true });
    expect(() => applyMove(state, 'south', { type: 'pass' })).toThrow();
  });

  it('lança erro se não é a vez do jogador', () => {
    const state = makeState({ current: 'west' });
    expect(() => applyMove(state, 'south', { type: 'pass' })).toThrow();
  });
});
