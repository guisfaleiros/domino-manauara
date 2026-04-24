# Dominó Manauara — Guia para Agentes Claude Code

Jogo de dominó digital com foco na variante **manauara** (regional de Manaus, AM). Este arquivo é o contexto principal de cada sessão com o Claude Code.

---

## Sobre o projeto

- **MVP original:** `index.html` único com ~2000 linhas (ver histórico no repo `domino-manaura`)
- **Versão atual:** app profissional em Expo + TypeScript, deploy web + mobile (iOS/Android)
- **Usuário:** Guilherme (guisfaleiros) — aprendendo a programar com Claude. Sempre explicar o porquê das escolhas.

## Stack

| Camada | Tech |
|--------|------|
| **App (web + mobile)** | Expo + React Native Web + TypeScript |
| **Estilo** | (a adicionar) NativeWind (Tailwind para RN) |
| **Estado global** | (a adicionar) Zustand |
| **Engine do jogo** | TypeScript puro em `src/engine/` — sem dependências externas |
| **Testes** | (a adicionar) Vitest (engine) + Playwright (UI) |
| **Backend multiplayer** | (futuro) Supabase (auth + Postgres + Realtime) |
| **Deploy web** | (a configurar) Vercel com deploy automático no push |
| **Deploy mobile** | (futuro) Expo EAS |

## Regras de ouro para o agente

1. **Sempre isolar regras do jogo em `src/engine/`** — nunca colocar `setState`, `useEffect` ou JSX lá dentro. Engine é TypeScript puro.
2. **Toda função do engine deve ter teste** (Vitest) — é como garantimos que a IA não quebra o que funciona.
3. **Componentes React Native ficam em `src/components/`**, telas em `src/screens/`. Nunca misturar lógica de regra dentro de componente.
4. **Tipagem forte sempre** — `any` é proibido fora de testes; usar tipos em `src/types/` e exportar do engine.
5. **Comentários explicam o PORQUÊ, não o QUÊ** — se a regra do dominó manauara for incomum (carroça central conta como ponta oposta, por exemplo), documenta na função.
6. **Mensagens de commit:** `{tipo}: {descrição}` — tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

## Estrutura do projeto

```
domino-manauara/
├── App.tsx                # Root do Expo
├── index.ts               # Entry point
├── src/
│   ├── engine/            # ⭐ Regras do jogo (TypeScript puro)
│   ├── components/        # Componentes React Native reutilizáveis
│   ├── screens/           # Telas (Home, Jogo, Sala, Perfil, Ranking)
│   ├── hooks/             # Custom hooks (useGame, useAuth)
│   ├── store/             # Zustand stores
│   └── types/             # Tipos compartilhados
├── assets/                # Imagens, fontes, sons
├── docs/
│   ├── ROADMAP.md         # Plano em 6 fases
│   └── GAME_RULES.md      # Regras do dominó manauara (fonte da verdade)
└── CLAUDE.md              # Este arquivo
```

## Protocolo de sessão

Toda sessão começa assim:

1. Ler `docs/ROADMAP.md` — entender em que fase estamos
2. Ler `docs/GAME_RULES.md` — fonte da verdade das regras
3. Rodar `git log --oneline -10` — entender o que foi feito recentemente
4. Perguntar ao usuário em que fase/feature quer trabalhar
5. Implementar **uma coisa de cada vez**, com testes antes de considerar pronto

## Comandos rápidos

```bash
npm run web        # inicia versão web (localhost)
npm run ios        # inicia iOS (precisa de macOS)
npm run android    # inicia Android (precisa Android Studio)
npm start          # Expo dev server (todos os alvos)
```

## Fases do projeto

Ver [`docs/ROADMAP.md`](docs/ROADMAP.md) — resumo:

- **Fase 0 (atual):** Migrar MVP do HTML para Expo/TS com testes
- **Fase 1:** Polish (animações, sons)
- **Fase 2:** Publicar nas lojas (iOS + Android)
- **Fase 3:** Contas + dados na nuvem (Supabase)
- **Fase 4:** Multiplayer online (salas públicas + privadas)
- **Fase 5:** Ranking competitivo e temporadas
- **Fase 6:** Tutorial e bots com múltiplos níveis
