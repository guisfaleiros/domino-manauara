# 🎯 Dominó Manauara

Jogo de dominó digital com a variante **manauara** (Manaus, AM), disponível em web, iOS e Android.

## Status

🚧 **Em desenvolvimento** — migrando do MVP (HTML único) para versão profissional em Expo + TypeScript.

## Rodar localmente

```bash
npm install
npm run web        # abre em localhost
```

Para iOS/Android, instalar o app **Expo Go** no celular e rodar `npm start` (escanear QR code).

## Stack

Expo (React Native Web) + TypeScript. Código 100% compartilhado entre web e mobile.

## Documentação

- [`CLAUDE.md`](CLAUDE.md) — Guia para sessões com Claude Code
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — Plano em 6 fases
- [`docs/GAME_RULES.md`](docs/GAME_RULES.md) — Regras oficiais do dominó manauara
- [`src/engine/README.md`](src/engine/README.md) — Arquitetura do motor de regras

## MVP original

A versão HTML inicial (2000+ linhas, funcional) está preservada no repositório [`domino-manaura`](https://github.com/guisfaleiros/domino-manaura), publicada em https://guisfaleiros.github.io/domino-manaura/.
