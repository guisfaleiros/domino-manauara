# Roadmap — Dominó Manauara

Plano em 6 fases. Cada fase entrega valor real antes da próxima começar.

---

## Fase 0 — Fundação 🚧 (atual)

**Objetivo:** Migrar o MVP (HTML único) para a estrutura profissional sem adicionar features novas.

- [x] Criar scaffold Expo + TypeScript
- [x] Documentação inicial (CLAUDE.md, ROADMAP.md, GAME_RULES.md)
- [ ] Configurar NativeWind (Tailwind)
- [x] Configurar Vitest para testes do engine
- [ ] Portar regras do jogo para `src/engine/` com testes
  - [x] `types.ts` — Piece, Hand, GameState, Move
  - [x] `deck.ts` — gerar/embaralhar/distribuir peças
  - [x] `legalMoves.ts` — jogadas válidas
  - [ ] `play.ts` — aplicar jogada
  - [ ] `score.ts` — cálculo de pontos
  - [ ] `roundEnd.ts` — dominó, jogo fechado, garagem
  - [ ] `bot/manauara.ts` — bot nível médio (paridade com MVP)
- [ ] Criar store Zustand com estado do jogo
- [ ] Recriar UI em React Native (Home, Jogo)
- [ ] Deploy web em Vercel
- [ ] ✅ **Entrega:** mesmo jogo do MVP, agora profissional

---

## Fase 1 — Polish

- [ ] Animações de peça (Reanimated)
- [ ] Sons (colocar peça, vitória, passar, galo)
- [ ] Haptics no mobile (vibração sutil)
- [ ] Telas: Menu principal, Configurações, Histórico local
- [ ] Analytics com PostHog (free tier)
- ✅ **Entrega:** versão web polida

---

## Fase 2 — Mobile nativo

- [ ] Setup Expo EAS Build
- [ ] Build iOS (TestFlight)
- [ ] Build Android (Play Console interno)
- [ ] Ícones + splash screen
- [ ] Ajustes de UX específicos mobile
- ✅ **Entrega:** app nas lojas (iOS + Android)

---

## Fase 3 — Contas + dados na nuvem

- [ ] Setup Supabase (projeto, schema, auth)
- [ ] Login (Google + email/senha)
- [ ] Perfil do jogador (nome, avatar, cidade)
- [ ] Sincronizar histórico de partidas
- [ ] Estatísticas pessoais (vitórias, pontos médios, etc)
- ✅ **Entrega:** jogadores identificados com dados persistentes

---

## Fase 4 — Multiplayer online ⭐

- [ ] Sistema de salas via Supabase Realtime
- [ ] Sala pública com matchmaking
- [ ] Sala privada com código de convite
- [ ] Sincronização de jogadas em tempo real
- [ ] Reconexão automática
- [ ] Chat de emotes (evita toxicidade)
- [ ] Spectator mode
- ✅ **Entrega:** jogar online com amigos e desconhecidos

---

## Fase 5 — Competitivo

- [ ] Sistema de ranking ELO (adaptado para duplas)
- [ ] Temporadas mensais
- [ ] Leaderboard (global, regional, local)
- [ ] Conquistas (badges)
- ✅ **Entrega:** engajamento competitivo de longo prazo

---

## Fase 6 — Aprendizado e IA

- [ ] Tutorial interativo (aprende dominó do zero)
- [ ] 3 níveis de bot:
  - **Iniciante** — joga aleatório válido
  - **Manauara** — estratégia média (paridade com MVP atual)
  - **Lenda** — conta peças, calcula probabilidade, bloqueia adversário
- [ ] Modo "dica" (bot sugere próxima jogada)
- ✅ **Entrega:** acessível a quem nunca jogou dominó

---

## Princípios

1. **Uma fase de cada vez.** Não começar a próxima enquanto a atual não estiver entregue.
2. **Toda regra do jogo tem teste.** A engine nunca quebra.
3. **Web primeiro, mobile depois.** Expo roda nos dois, mas focamos em web até Fase 1 estar sólida.
4. **Deploy cedo e sempre.** Cada fase termina com deploy público.
