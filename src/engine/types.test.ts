import { describe, it, expect } from 'vitest';
import { TEAM_OF, PLAYER_ORDER, nextPlayer, opposingTeam } from './types';

describe('tipos fundamentais', () => {
  it('mapeia jogadores para duplas corretamente', () => {
    expect(TEAM_OF.south).toBe('A');
    expect(TEAM_OF.north).toBe('A');
    expect(TEAM_OF.east).toBe('B');
    expect(TEAM_OF.west).toBe('B');
  });

  it('tem ordem anti-horária de 4 jogadores', () => {
    expect(PLAYER_ORDER).toHaveLength(4);
    expect(PLAYER_ORDER[0]).toBe('south');
  });

  it('nextPlayer cicla anti-horário (sul → oeste → norte → leste → sul)', () => {
    expect(nextPlayer('south')).toBe('west');
    expect(nextPlayer('west')).toBe('north');
    expect(nextPlayer('north')).toBe('east');
    expect(nextPlayer('east')).toBe('south');
  });

  it('opposingTeam inverte as duplas', () => {
    expect(opposingTeam('A')).toBe('B');
    expect(opposingTeam('B')).toBe('A');
  });
});
