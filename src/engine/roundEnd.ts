import type { GameState, Player, Team, Hands } from './types';
import { PLAYER_ORDER, TEAM_OF, opposingTeam } from './types';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Soma os valores de todas as peças restantes na mão de uma dupla. */
export function sumHandTeam(hands: Hands, team: Team): number {
  return PLAYER_ORDER
    .filter(p => TEAM_OF[p] === team)
    .flatMap(p => hands[p])
    .reduce((acc, p) => acc + p.a + p.b, 0);
}

/** Arredonda para baixo ao múltiplo de 5 mais próximo (garagem). */
export function garagem(rawPoints: number): number {
  return Math.floor(rawPoints / 5) * 5;
}

// ─── tipos de resultado ───────────────────────────────────────────────────────

export type RoundEndType =
  | 'domino'          // batida normal
  | 'domino_carroca'  // batida com carroça (+20 extra)
  | 'blocked'         // jogo fechado — uma dupla vence pela contagem
  | 'draw';           // jogo fechado — empate na contagem

export type RoundResult = Readonly<{
  type: RoundEndType;
  /** Jogador vencedor. null em caso de empate. */
  winner: Player | null;
  winnerTeam: Team | null;
  /** Soma bruta das peças na mão da dupla perdedora. */
  garagemRaw: number;
  /** Pontos de garagem (= garagem(garagemRaw)). */
  garagemPts: number;
  /** Estado com scores e lastWinner atualizados. */
  state: GameState;
}>;

// ─── resolveRound ─────────────────────────────────────────────────────────────

/**
 * Calcula o resultado de uma rodada finalizada (state.over === true).
 *
 * Aplica:
 * - Bônus de carroça (+20 se a última peça foi carroça)
 * - Garagem (soma das peças da dupla perdedora, arredondado a múltiplo de 5)
 *
 * Não avança `state.round` — isso é responsabilidade do game loop.
 */
export function resolveRound(state: GameState): RoundResult {
  if (!state.over) throw new Error('A rodada ainda não acabou');

  // ── dominó: algum jogador ficou sem peças ────────────────────────────────
  const winner = PLAYER_ORDER.find(p => state.hands[p].length === 0) ?? null;

  if (winner !== null) {
    const lastPiece   = state.board[state.board.length - 1]!;
    const isCarroca   = lastPiece.isCarroca;
    const winnerTeam  = TEAM_OF[winner];
    const loserTeam   = opposingTeam(winnerTeam);

    let { scoreA, scoreB } = state;

    if (isCarroca) {
      if (winnerTeam === 'A') scoreA += 20; else scoreB += 20;
    }

    const garagemRaw = sumHandTeam(state.hands, loserTeam);
    const garagemPts = garagem(garagemRaw);
    if (garagemPts > 0) {
      if (winnerTeam === 'A') scoreA += garagemPts; else scoreB += garagemPts;
    }

    return {
      type: isCarroca ? 'domino_carroca' : 'domino',
      winner,
      winnerTeam,
      garagemRaw,
      garagemPts,
      state: { ...state, scoreA, scoreB, lastWinner: winner },
    };
  }

  // ── jogo fechado: ninguém pode jogar ─────────────────────────────────────
  const sumA = sumHandTeam(state.hands, 'A');
  const sumB = sumHandTeam(state.hands, 'B');

  if (sumA === sumB) {
    return {
      type: 'draw',
      winner: null, winnerTeam: null,
      garagemRaw: 0, garagemPts: 0,
      state: { ...state, lastWinner: null },
    };
  }

  const winnerTeam: Team = sumA < sumB ? 'A' : 'B';
  const loserTeam         = opposingTeam(winnerTeam);
  const garagemRaw        = sumHandTeam(state.hands, loserTeam);
  const garagemPts        = garagem(garagemRaw);

  let { scoreA, scoreB } = state;
  if (garagemPts > 0) {
    if (winnerTeam === 'A') scoreA += garagemPts; else scoreB += garagemPts;
  }

  // lastWinner = primeiro jogador da dupla vencedora (quem começa a próxima rodada)
  const winnerPlayer = PLAYER_ORDER.find(p => TEAM_OF[p] === winnerTeam) ?? null;

  return {
    type: 'blocked',
    winner: winnerPlayer,
    winnerTeam,
    garagemRaw,
    garagemPts,
    state: { ...state, scoreA, scoreB, lastWinner: winnerPlayer },
  };
}
