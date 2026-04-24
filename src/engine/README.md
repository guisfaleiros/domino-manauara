# Engine — Regras do Dominó Manauara

Este pacote contém **apenas** as regras do jogo, em TypeScript puro.

- **Sem** dependências de React, React Native, ou DOM
- **Funções puras** sempre que possível (dado `estado`, retornar `novo estado`)
- **100% testável** com Vitest

O mesmo código roda no cliente, no bot, e no futuro servidor multiplayer — por isso o isolamento é crítico.

## Estrutura alvo

```
engine/
├── types.ts        # Piece, Hand, GameState, Move, Team
├── deck.ts         # mkDeck, shuffle, deal
├── legalMoves.ts   # getPlayable, matchEnds, activeKeys
├── play.ts         # playPiece, execPass (aplicam jogada e retornam novo state)
├── score.ts        # sumEnds, chkScore, sumHand
├── roundEnd.ts     # endRoundDomino, endRoundBlocked
├── bot/
│   ├── easy.ts
│   ├── manauara.ts
│   └── lenda.ts    # bot avançado: conta peças, calcula probabilidade
└── __tests__/      # testes Vitest
```

Ver [`docs/GAME_RULES.md`](../../docs/GAME_RULES.md) para as regras do dominó manauara.
