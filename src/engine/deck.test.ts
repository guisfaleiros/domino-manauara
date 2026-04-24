import { describe, it, expect } from 'vitest';
import { mkDeck, shuffle, deal, findPlayer66, getCarrocas } from './deck';

describe('mkDeck', () => {
  it('gera exatamente 28 peças', () => {
    expect(mkDeck()).toHaveLength(28);
  });

  it('sempre tem a <= b', () => {
    for (const p of mkDeck()) {
      expect(p.a).toBeLessThanOrEqual(p.b);
    }
  });

  it('contém o [6:6]', () => {
    expect(mkDeck()).toContainEqual({ a: 6, b: 6 });
  });

  it('contém o [0:0]', () => {
    expect(mkDeck()).toContainEqual({ a: 0, b: 0 });
  });

  it('não tem peças duplicadas', () => {
    const deck = mkDeck();
    const keys = deck.map(p => `${p.a}:${p.b}`);
    expect(new Set(keys).size).toBe(28);
  });
});

describe('shuffle', () => {
  it('mantém 28 peças', () => {
    expect(shuffle(mkDeck())).toHaveLength(28);
  });

  it('não modifica o deck original', () => {
    const original = mkDeck();
    const copy = [...original];
    shuffle(original);
    expect(original).toEqual(copy);
  });

  it('contém as mesmas peças (diferentes posições)', () => {
    const deck = mkDeck();
    const shuffled = shuffle(deck);
    expect(shuffled).toEqual(expect.arrayContaining(deck));
  });
});

describe('deal', () => {
  it('distribui 7 peças para cada jogador', () => {
    const hands = deal(shuffle(mkDeck()));
    expect(hands.south).toHaveLength(7);
    expect(hands.north).toHaveLength(7);
    expect(hands.east).toHaveLength(7);
    expect(hands.west).toHaveLength(7);
  });

  it('não repete peças entre jogadores', () => {
    const hands = deal(shuffle(mkDeck()));
    const all = [
      ...hands.south,
      ...hands.north,
      ...hands.east,
      ...hands.west,
    ];
    const keys = all.map(p => `${p.a}:${p.b}`);
    expect(new Set(keys).size).toBe(28);
  });
});

describe('findPlayer66', () => {
  it('encontra quem tem o [6:6]', () => {
    const hands = deal(shuffle(mkDeck()));
    const player = findPlayer66(hands);
    expect(player).not.toBeNull();
    expect(hands[player!]).toContainEqual({ a: 6, b: 6 });
  });
});

describe('getCarrocas', () => {
  it('retorna só peças com a === b', () => {
    const carroCas = getCarrocas(mkDeck());
    expect(carroCas).toHaveLength(7); // 0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6
    for (const p of carroCas) {
      expect(p.a).toBe(p.b);
    }
  });
});
