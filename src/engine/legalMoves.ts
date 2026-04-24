import type { GameState, Player, Piece, Arm, PlacedPiece } from './types';

/**
 * Braços onde novas peças podem ser colocadas agora.
 *
 * Regras manauara:
 * - Tabuleiro vazio → [] (primeira peça vai para 'center', sem escolha)
 * - Só carroça central, nenhum braço tem peça → apenas 'right' (segunda peça)
 * - 'right' tem peça mas 'left' não → ambos disponíveis (left conecta na carroça)
 * - 'top'/'bottom' só abrem depois que left E right têm peças
 */
export function activeArms(state: GameState): Arm[] {
  if (state.board.length === 0) return [];

  const { arms } = state;
  const hasLeft  = arms.left   > 0;
  const hasRight = arms.right  > 0;
  const hasTop   = arms.top    > 0;
  const hasBot   = arms.bottom > 0;
  const result: Arm[] = [];

  if (!hasLeft && !hasRight) {
    // Só carroça central — segunda peça obrigatoriamente para right
    result.push('right');
  } else {
    if (hasLeft)  result.push('left');
    if (hasRight) result.push('right');
    // Lado vazio ainda conecta na carroça central
    if (!hasLeft)  result.push('left');
    if (!hasRight) result.push('right');
  }

  // Vertical só abre depois que AMBOS horizontais têm peças
  if (hasLeft && hasRight) {
    if (hasTop)  result.push('top');
    if (hasBot)  result.push('bottom');
    if (!hasTop) result.push('top');
    if (!hasBot) result.push('bottom');
  }

  return [...new Set(result)];
}

/**
 * Braços cujos valores entram na soma de pontuação.
 *
 * Regra especial da carroça central:
 * quando só um lado horizontal tem peças, a carroça central conta
 * como ponta do lado oposto (somente eixo horizontal).
 */
export function activeArmsForScore(state: GameState): Arm[] {
  const { arms } = state;
  const hasLeft  = arms.left   > 0;
  const hasRight = arms.right  > 0;
  const hasTop   = arms.top    > 0;
  const hasBot   = arms.bottom > 0;
  const result: Arm[] = [];

  if (hasLeft)  result.push('left');
  if (hasRight) result.push('right');

  // Carroça central age como ponta do lado oposto vazio (horizontal)
  if (hasRight && !hasLeft)  result.push('left');
  if (hasLeft  && !hasRight) result.push('right');

  if (hasTop) result.push('top');
  if (hasBot) result.push('bottom');

  return [...new Set(result)];
}

/**
 * Última peça colocada em determinado braço.
 * Se o braço estiver vazio mas existir carroça central, ela age como proxy
 * para os braços left/right (ambos os lados do eixo horizontal).
 */
function lastOnArm(state: GameState, arm: Arm): PlacedPiece | null {
  for (let i = state.board.length - 1; i >= 0; i--) {
    if (state.board[i]!.arm === arm) return state.board[i]!;
  }
  // Proxy só se o braço não tem peças — evita usar center quando arms[arm] > 0
  if ((arm === 'left' || arm === 'right') && state.arms[arm] === 0 && state.board[0]?.arm === 'center') {
    return state.board[0] ?? null;
  }
  return null;
}

/**
 * Soma dos valores das pontas para cálculo de pontuação.
 *
 * Carroça na ponta de um braço conta em dobro (ambas as faces expostas).
 * Caso especial: apenas carroça central na mesa → retorna a×2.
 */
export function sumEnds(state: GameState): number {
  const scoreArms = activeArmsForScore(state);

  // Só a carroça central, nenhum braço com peça
  if (scoreArms.length === 0) {
    const center = state.board.find(p => p.arm === 'center');
    return center ? center.a * 2 : 0;
  }

  let sum = 0;
  for (const arm of scoreArms) {
    const value = state.ends[arm];
    if (value === null) continue;
    const last = lastOnArm(state, arm);
    sum += last?.isCarroca ? value * 2 : value;
  }
  return sum;
}

/**
 * Peças da mão de `player` que podem ser jogadas agora.
 *
 * - Tabuleiro vazio + isFirstPlay: só [6:6]
 * - Tabuleiro vazio + !isFirstPlay (rodadas seguintes): qualquer carroça
 * - Tabuleiro com peças: peças que casam com alguma ponta ativa
 */
export function getPlayable(state: GameState, player: Player): Piece[] {
  const hand = state.hands[player];

  if (state.board.length === 0) {
    if (state.isFirstPlay) return hand.filter(p => p.a === 6 && p.b === 6);
    return hand.filter(p => p.a === p.b);
  }

  const validValues = activeArms(state)
    .map(arm => state.ends[arm])
    .filter((v): v is number => v !== null);

  return hand.filter(p => validValues.includes(p.a) || validValues.includes(p.b));
}

/**
 * Braços onde `piece` pode ser conectada no estado atual.
 * Retorna [] quando o tabuleiro está vazio (peça vai para center automaticamente).
 */
export function matchArms(state: GameState, piece: Piece): Arm[] {
  if (state.board.length === 0) return [];

  const result: Arm[] = [];
  for (const arm of activeArms(state)) {
    const value = state.ends[arm];
    if (value !== null && (piece.a === value || piece.b === value)) {
      if (!result.includes(arm)) result.push(arm);
    }
  }
  return result;
}
