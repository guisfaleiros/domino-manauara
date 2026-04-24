import type { GameState, Player, Move, Piece, Arm, PipValue, PlacedPiece } from './types';
import { PLAYER_ORDER, TEAM_OF, nextPlayer, opposingTeam } from './types';
import { getPlayable, sumEnds } from './legalMoves';

// ─── helpers ─────────────────────────────────────────────────────────────────

function removeFromHand(hand: readonly Piece[], piece: Piece): Piece[] {
  const idx = hand.findIndex(p => p.a === piece.a && p.b === piece.b);
  if (idx === -1) throw new Error(`Peça [${piece.a}:${piece.b}] não está na mão`);
  return [...hand.slice(0, idx), ...hand.slice(idx + 1)];
}

function freeVal(piece: Piece, connectValue: PipValue): PipValue {
  if (piece.a === piece.b) return piece.a;
  return piece.a === connectValue ? piece.b : piece.a;
}

function addScore(state: GameState, team: 'A' | 'B', pts: number): Pick<GameState, 'scoreA' | 'scoreB'> {
  return {
    scoreA: team === 'A' ? state.scoreA + pts : state.scoreA,
    scoreB: team === 'B' ? state.scoreB + pts : state.scoreB,
  };
}

function blocked(state: GameState): boolean {
  return PLAYER_ORDER.every(p => getPlayable(state, p).length === 0);
}

// ─── applyGalo ───────────────────────────────────────────────────────────────

/**
 * Anuncia galo. Não consome a vez — o jogador ainda precisa jogar uma peça.
 * Apenas marca galoPhase=1 e registra o anunciante.
 */
function applyGalo(state: GameState, player: Player): GameState {
  return { ...state, galo: player, galoPhase: 1 };
}

// ─── applyPlay ───────────────────────────────────────────────────────────────

function applyPlay(state: GameState, player: Player, piece: Piece, arm: Arm): GameState {
  const newHand = removeFromHand(state.hands[player], piece);
  const newHands = { ...state.hands, [player]: newHand };

  let { scoreA, scoreB } = state;
  let newGalo   = state.galo;
  let newGaloPhase = state.galoPhase;

  // Galo phase tracking
  if (state.galoPhase === 1 && player === state.galo) {
    // Anunciante jogou → aguarda os 3 passes
    newGaloPhase = 2;
  } else if (state.galoPhase === 2 && player !== state.galo) {
    // Outro jogador jogou → galo falso: dupla adversária do anunciante ganha +50
    const s = addScore(state, opposingTeam(TEAM_OF[state.galo!]), 50);
    scoreA = s.scoreA; scoreB = s.scoreB;
    newGalo = null;
    newGaloPhase = 0;
  }

  // Coloca a peça na mesa
  let newBoard: PlacedPiece[];
  let newEnds  = { ...state.ends };
  let newArms  = { ...state.arms };
  let newBatida = state.batida;
  let newIsFirstPlay = state.isFirstPlay;

  if (state.board.length === 0) {
    // Primeira peça da rodada → sempre vai para o centro (carroça obrigatória)
    const placed: PlacedPiece = {
      a: piece.a, b: piece.b, isCarroca: true, arm: 'center',
      freeVal: piece.a as PipValue,
    };
    newBoard = [placed];
    newEnds  = { left: piece.a as PipValue, right: piece.a as PipValue,
                  top: piece.a as PipValue, bottom: piece.a as PipValue };
    newIsFirstPlay = false;
    newBatida = player;
  } else {
    const connectValue = state.ends[arm]!;
    const isCarroca    = piece.a === piece.b;
    const fv           = freeVal(piece, connectValue);
    const placed: PlacedPiece = { a: piece.a, b: piece.b, isCarroca, arm, freeVal: fv };
    newBoard = [...state.board, placed];
    // Carroça não muda a ponta (conecta e expõe o mesmo valor)
    if (!isCarroca) newEnds = { ...newEnds, [arm]: fv };
    newArms = { ...newArms, [arm]: newArms[arm] + 1 };
  }

  // Estado intermediário para calcular pontuação com a peça já colocada
  const mid: GameState = {
    ...state,
    hands: newHands,
    board: newBoard,
    ends: newEnds,
    arms: newArms,
    scoreA,
    scoreB,
    passChain: [],
    galo: newGalo,
    galoPhase: newGaloPhase as GameState['galoPhase'],
    batida: newBatida,
    isFirstPlay: newIsFirstPlay,
  };

  // Pontuação: soma das pontas múltiplo de 5 → marca
  const endSum = sumEnds(mid);
  if (endSum > 0 && endSum % 5 === 0) {
    const s = addScore(mid, TEAM_OF[player], endSum);
    scoreA = s.scoreA;
    scoreB = s.scoreB;
  }

  const roundOver = newHand.length === 0 || blocked({ ...mid, scoreA, scoreB });

  return {
    ...mid,
    scoreA,
    scoreB,
    current: roundOver ? null : nextPlayer(player),
    over: roundOver,
  };
}

// ─── applyPass ───────────────────────────────────────────────────────────────

function applyPass(state: GameState, player: Player): GameState {
  let { scoreA, scoreB } = state;
  let newGalo      = state.galo;
  let newGaloPhase = state.galoPhase;
  let newBatida    = state.batida;

  // Galo void: anunciante passa sem ter jogado (sem penalidade — regra manauara)
  if (state.galoPhase === 1 && player === state.galo) {
    newGalo = null;
    newGaloPhase = 0;
  }

  const newPassChain = [...state.passChain, player];

  // Pontuação do passe
  if (newPassChain.length === 1) {
    // Primeiro passe → adversários ganham +20
    const s = addScore(state, opposingTeam(TEAM_OF[player]), 20);
    scoreA = s.scoreA; scoreB = s.scoreB;
  }
  // Segundo passe → nas costas, sem pontos

  // Batida transferida se o portador passou
  if (state.batida === player) {
    newBatida = nextPlayer(player);
  }

  // Terceiro passe → galo ou continua
  if (newPassChain.length === 3) {
    if (newGaloPhase === 2 && newGalo !== null) {
      // Galo confirmado!
      const s = addScore({ ...state, scoreA, scoreB }, TEAM_OF[newGalo], 50);
      scoreA = s.scoreA; scoreB = s.scoreB;
    }
    // Volta para o jogador que não passou (quem jogou a última peça)
    const nextP = PLAYER_ORDER.find(p => !newPassChain.includes(p)) ?? nextPlayer(player);
    return {
      ...state,
      scoreA, scoreB,
      passChain: [],
      galo: null, galoPhase: 0,
      batida: newBatida,
      current: nextP,
      over: false,
    };
  }

  const newState: GameState = {
    ...state,
    scoreA, scoreB,
    passChain: newPassChain,
    galo: newGalo,
    galoPhase: newGaloPhase as GameState['galoPhase'],
    batida: newBatida,
    current: nextPlayer(player),
  };

  if (blocked(newState)) return { ...newState, over: true, current: null };

  return newState;
}

// ─── ponto de entrada público ─────────────────────────────────────────────────

/**
 * Aplica um movimento e retorna o novo estado da rodada.
 *
 * O estado retornado tem `over: true` quando:
 * - Um jogador ficou sem peças (dominó)
 * - Nenhum jogador tem jogada válida (jogo fechado)
 *
 * Use `roundEnd.ts` para calcular garagem e pontuação final da rodada.
 */
export function applyMove(state: GameState, player: Player, move: Move): GameState {
  if (state.over)            throw new Error('A rodada já acabou');
  if (state.current !== player) throw new Error(`Não é a vez de ${player}`);

  switch (move.type) {
    case 'play':  return applyPlay(state, player, move.piece, move.arm);
    case 'pass':  return applyPass(state, player);
    case 'galo':  return applyGalo(state, player);
  }
}
