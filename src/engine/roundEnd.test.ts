import { describe, it, expect } from 'vitest';
import type { GameState } from './types';
import { sumHandTeam, garagem, resolveRound } from './roundEnd';

function makeState(overrides: Partial<GameState>): GameState {
  return {
    limit: 100, scoreA: 0, scoreB: 0, round: 1,
    hands: { south: [], west: [], north: [], east: [] },
    board: [],
    ends: { left: null, right: null, top: null, bottom: null },
    arms: { left: 0, right: 0, top: 0, bottom: 0 },
    current: null, passChain: [],
    galo: null, galoPhase: 0,
    lastWinner: null, batida: null,
    isFirstPlay: false, over: true,
    ...overrides,
  };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

describe('sumHandTeam', () => {
  it('soma os valores de todas as peças da dupla', () => {
    const hands = {
      south: [{ a: 3, b: 2 }, { a: 1, b: 0 }], // 5 + 1 = 6
      north: [{ a: 4, b: 4 }],                   // 8
      west:  [{ a: 6, b: 0 }],                   // 6
      east:  [],
    };
    expect(sumHandTeam(hands, 'A')).toBe(14); // south(6) + north(8)
    expect(sumHandTeam(hands, 'B')).toBe(6);  // west(6) + east(0)
  });

  it('mão vazia → 0', () => {
    const hands = { south: [], west: [], north: [], east: [] };
    expect(sumHandTeam(hands, 'A')).toBe(0);
  });
});

describe('garagem', () => {
  it('arredonda para baixo ao múltiplo de 5', () => {
    expect(garagem(0)).toBe(0);
    expect(garagem(4)).toBe(0);
    expect(garagem(5)).toBe(5);
    expect(garagem(7)).toBe(5);
    expect(garagem(23)).toBe(20);
    expect(garagem(25)).toBe(25);
    expect(garagem(47)).toBe(45);
  });
});

// ─── resolveRound — dominó ────────────────────────────────────────────────────

describe('resolveRound: dominó', () => {
  it('detecta dominó quando jogador fica sem peças', () => {
    // south (Dupla A) bateu — mão vazia, dupla B tem peças
    const state = makeState({
      hands: {
        south: [],
        west:  [{ a: 3, b: 2 }], // 5 pts
        north: [{ a: 1, b: 0 }], // 1 pt
        east:  [{ a: 4, b: 1 }], // 5 pts
      },
      board: [{ a: 5, b: 3, isCarroca: false, arm: 'right', freeVal: 3 }],
    });
    const result = resolveRound(state);
    expect(result.type).toBe('domino');
    expect(result.winner).toBe('south');
    expect(result.winnerTeam).toBe('A');
  });

  it('calcula garagem da dupla perdedora', () => {
    // Dupla B tem: west[3:2]=5, east[4:1]=5 → raw=10, garagem=10
    const state = makeState({
      hands: {
        south: [],
        west:  [{ a: 3, b: 2 }],
        north: [],
        east:  [{ a: 4, b: 1 }],
      },
      board: [{ a: 5, b: 3, isCarroca: false, arm: 'right', freeVal: 3 }],
    });
    const result = resolveRound(state);
    expect(result.garagemRaw).toBe(10);
    expect(result.garagemPts).toBe(10);
    expect(result.state.scoreA).toBe(10); // garagem vai para dupla A
  });

  it('garagem não múltipla de 5 → arredonda para baixo', () => {
    // Dupla B tem: west[3:2]=5, east[3:0]=3 → raw=8, garagem=5
    const state = makeState({
      hands: {
        south: [],
        west:  [{ a: 3, b: 2 }],
        north: [],
        east:  [{ a: 3, b: 0 }],
      },
      board: [{ a: 5, b: 3, isCarroca: false, arm: 'right', freeVal: 3 }],
    });
    const result = resolveRound(state);
    expect(result.garagemRaw).toBe(8);
    expect(result.garagemPts).toBe(5);
  });

  it('garagem menor que 5 → 0 pts (não transfere)', () => {
    const state = makeState({
      hands: {
        south: [],
        west:  [{ a: 1, b: 0 }], // 1 pt
        north: [],
        east:  [{ a: 2, b: 0 }], // 2 pts → raw=3
      },
      board: [{ a: 5, b: 3, isCarroca: false, arm: 'right', freeVal: 3 }],
    });
    const result = resolveRound(state);
    expect(result.garagemPts).toBe(0);
    expect(result.state.scoreA).toBe(0);
  });
});

describe('resolveRound: dominó de carroça', () => {
  it('última peça carroça → +20 pts extra para a dupla vencedora', () => {
    const state = makeState({
      hands: {
        south: [],
        west:  [{ a: 3, b: 2 }], // 5 pts → garagem 5
        north: [],
        east:  [],
      },
      board: [{ a: 3, b: 3, isCarroca: true, arm: 'right', freeVal: 3 }],
      scoreA: 30,
    });
    const result = resolveRound(state);
    expect(result.type).toBe('domino_carroca');
    // scoreA começa em 30 + 20 (carroça) + 5 (garagem) = 55
    expect(result.state.scoreA).toBe(55);
  });
});

// ─── resolveRound — jogo fechado ──────────────────────────────────────────────

describe('resolveRound: jogo fechado', () => {
  it('dupla com menor soma de peças vence e ganha a garagem', () => {
    // Em jogo fechado TODOS têm peças — ninguém bateu
    const state = makeState({
      hands: {
        south: [{ a: 1, b: 0 }], // A: 1
        north: [{ a: 2, b: 0 }], // A: 2 → total A = 3
        west:  [{ a: 6, b: 5 }], // B: 11
        east:  [{ a: 4, b: 0 }], // B: 4  → total B = 15
      },
      board: [{ a: 6, b: 3, isCarroca: false, arm: 'right', freeVal: 3 }],
    });
    const result = resolveRound(state);
    expect(result.type).toBe('blocked');
    expect(result.winnerTeam).toBe('A'); // A (3) < B (15)
    expect(result.garagemRaw).toBe(15);
    expect(result.garagemPts).toBe(15);
    expect(result.state.scoreA).toBe(15);
  });

  it('empate na contagem → draw, sem garagem', () => {
    const state = makeState({
      hands: {
        south: [{ a: 2, b: 1 }], // A: 3
        north: [{ a: 1, b: 0 }], // A: 1 → total A = 4
        west:  [{ a: 2, b: 1 }], // B: 3
        east:  [{ a: 1, b: 0 }], // B: 1 → total B = 4
      },
      board: [{ a: 4, b: 3, isCarroca: false, arm: 'right', freeVal: 3 }],
    });
    const result = resolveRound(state);
    expect(result.type).toBe('draw');
    expect(result.winner).toBeNull();
    expect(result.garagemPts).toBe(0);
    expect(result.state.scoreA).toBe(0);
    expect(result.state.scoreB).toBe(0);
  });

  it('lastWinner atualizado para o primeiro jogador da dupla vencedora', () => {
    const state = makeState({
      hands: {
        south: [{ a: 1, b: 0 }], // A: 1
        north: [{ a: 1, b: 0 }], // A: 1 → total A = 2
        west:  [{ a: 6, b: 5 }], // B: 11
        east:  [{ a: 4, b: 0 }], // B: 4  → total B = 15
      },
      board: [{ a: 3, b: 2, isCarroca: false, arm: 'right', freeVal: 2 }],
    });
    const result = resolveRound(state);
    // Dupla A vence; primeiro jogador de A na ordem é 'south'
    expect(result.state.lastWinner).toBe('south');
  });
});

// ─── guardrail ────────────────────────────────────────────────────────────────

describe('resolveRound: guardrail', () => {
  it('lança erro se rodada ainda não acabou', () => {
    const state = makeState({ over: false });
    expect(() => resolveRound(state)).toThrow();
  });
});
