/**
 * Tipos fundamentais do engine de Dominó Manauara.
 *
 * Todos os tipos aqui são imutáveis — operações que "mudam" estado retornam
 * uma nova cópia do `GameState`. Isso permite histórico de jogadas, undo, e
 * sincronização confiável em multiplayer.
 *
 * Ver docs/GAME_RULES.md para as regras.
 */

/** Valor possível de uma face de peça: 0 a 6. */
export type PipValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Peça de dominó. Convenção: `a <= b` sempre.
 * Uma peça com `a === b` é uma carroça.
 */
export type Piece = Readonly<{ a: PipValue; b: PipValue }>;

/** Os 4 jogadores por posição na mesa. */
export type Player = 'south' | 'west' | 'north' | 'east';

/** As duas duplas. Sul+Norte = A, Leste+Oeste = B. */
export type Team = 'A' | 'B';

/** Os 4 braços da mesa. */
export type Arm = 'left' | 'right' | 'top' | 'bottom';

/**
 * Peça posicionada na mesa.
 * - `arm: 'center'` é exclusivo da carroça inicial
 * - `isCarroca`: true se a === b
 * - `freeVal`: valor da face livre (para carroça, igual ao a)
 */
export type PlacedPiece = Readonly<{
  a: PipValue;
  b: PipValue;
  isCarroca: boolean;
  arm: Arm | 'center';
  freeVal: PipValue;
}>;

/** Mão de cada jogador — array de peças. */
export type Hands = Readonly<Record<Player, readonly Piece[]>>;

/** Valor exposto em cada ponta. null se o braço não tem peça. */
export type Ends = Readonly<Record<Arm, PipValue | null>>;

/** Quantidade de peças em cada braço. */
export type ArmCounts = Readonly<Record<Arm, number>>;

/**
 * Fase do galo (anúncio de batida iminente):
 * - 0: sem galo ativo
 * - 1: anunciado, ainda não jogou
 * - 2: anunciou e jogou, aguardando passes dos adversários
 */
export type GaloPhase = 0 | 1 | 2;

/** Estado completo da partida. Imutável. */
export type GameState = Readonly<{
  /** Limite de pontos para a partida (50/100/150/200). */
  limit: number;

  /** Pontos das duplas. */
  scoreA: number;
  scoreB: number;

  /** Número da rodada atual (1, 2, 3, ...). */
  round: number;

  /** Peças na mão de cada jogador. */
  hands: Hands;

  /** Peças na mesa em ordem cronológica de colocação. */
  board: readonly PlacedPiece[];

  /** Valores expostos em cada ponta. */
  ends: Ends;

  /** Contagem de peças em cada braço. */
  arms: ArmCounts;

  /** Jogador da vez. null quando a rodada acabou. */
  current: Player | null;

  /** Jogadores que passaram em sequência (reseta ao jogar). */
  passChain: readonly Player[];

  /** Quem anunciou galo (se houver). */
  galo: Player | null;

  /** Fase do galo. */
  galoPhase: GaloPhase;

  /** Quem venceu a rodada anterior (para definir quem abre a próxima). */
  lastWinner: Player | null;

  /** Quem tem a batida (marcador visual — abriu a rodada ou recebeu após passe). */
  batida: Player | null;

  /**
   * True só na primeira jogada da primeira rodada (onde o [6:6] é obrigatório).
   * Em rodadas seguintes, qualquer carroça pode abrir.
   */
  isFirstPlay: boolean;

  /** True quando a rodada está finalizada (dominó ou fechado). */
  over: boolean;
}>;

/**
 * Movimento que um jogador pode fazer.
 * - `type: 'play'` — coloca uma peça em um braço específico
 * - `type: 'pass'` — passa a vez (obrigatório se não tem peça jogável)
 * - `type: 'galo'` — anuncia galo (antes de jogar; não consome a vez)
 */
export type Move =
  | Readonly<{ type: 'play'; piece: Piece; arm: Arm }>
  | Readonly<{ type: 'pass' }>
  | Readonly<{ type: 'galo' }>;

/** Mapeamento estático de jogador → dupla. */
export const TEAM_OF: Readonly<Record<Player, Team>> = {
  south: 'A',
  north: 'A',
  east: 'B',
  west: 'B',
};

/** Ordem anti-horária de jogada. */
export const PLAYER_ORDER: readonly Player[] = ['south', 'west', 'north', 'east'];

/** Próximo jogador na ordem. */
export function nextPlayer(current: Player): Player {
  const idx = PLAYER_ORDER.indexOf(current);
  return PLAYER_ORDER[(idx + 1) % 4]!;
}

/** Dupla adversária. */
export function opposingTeam(team: Team): Team {
  return team === 'A' ? 'B' : 'A';
}
