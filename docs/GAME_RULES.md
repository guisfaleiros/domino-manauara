# Regras do Dominó Manauara

Este documento é a **fonte da verdade** das regras do jogo. Todo código no `src/engine/` deve implementar exatamente o que está aqui.

Extraído e formalizado a partir do MVP HTML original (v6).

---

## 1. Setup

- **Peças:** 28 peças de dominó — todas as combinações de `[a:b]` onde `0 ≤ a ≤ b ≤ 6`
- **Jogadores:** 4, distribuídos em **2 duplas** jogando em lados opostos:
  - **Dupla A:** Sul + Norte
  - **Dupla B:** Leste + Oeste
- **Mão inicial:** 7 peças por jogador
- **Ordem de jogada:** sentido anti-horário: Sul → Oeste → Norte → Leste → Sul …
- **Limite da partida:** escolhido antes do jogo (50, 100, 150 ou 200 pontos). Primeira dupla a atingir vence.

## 2. Abertura

### Primeira rodada da partida
- Quem tem a **carroça [6:6]** começa obrigatoriamente.
- A peça jogada é o [6:6] **sem exceção**.

### Rodadas seguintes
A abertura depende de quem venceu a rodada anterior:

| Situação | Quem começa |
|----------|-------------|
| Vencedor tem carroça | Vencedor joga sua carroça |
| Vencedor não tem carroça | Próximo jogador (anti-horário) que tiver carroça |
| Ninguém tem carroça | Jogador com [6:6] |
| Rodada anterior fechada (empate) | Quem tem [6:6] |

A primeira peça é sempre uma carroça (exceto o caso extremo de ninguém ter — aí vai [6:6]).

## 3. Mesa — disposição das peças

A mesa tem **quatro braços** saindo da carroça central:

```
          ↑ top
          │
 left ←  [•]  → right
          │
          ↓ bottom
```

- A primeira carroça vai no centro
- A segunda peça é jogada **horizontal** (no braço `right`)
- Os braços **`top` e `bottom` só abrem depois que `left` E `right` já têm peças**
- Cada braço tem uma **ponta** com valor (número exposto na extremidade)

### Regra da carroça central (exceção importante)

Quando só **um lado horizontal** (left OU right) tem peças, a carroça central conta como ponta no **lado oposto vazio**.

Exemplo: mesa tem só `[6:6]` e uma peça em `right`. A "ponta left" não existe fisicamente, mas para pontuação conta como 6 (a face da carroça voltada para esquerda).

Esta regra só vale no **eixo horizontal**. Os braços `top` e `bottom` nunca têm carroça oposta — só contam quando têm peças de fato.

## 4. Jogadas válidas

Um jogador pode jogar uma peça `[a:b]` se:

1. Existe pelo menos uma ponta ativa com valor igual a `a` ou `b`
2. O braço correspondente está disponível (respeitando a regra de top/bottom só abrirem depois do horizontal)

Se o jogador não tem nenhuma peça jogável, é **obrigado a passar**.

## 5. Pontuação por jogada

Após cada jogada, somam-se os valores de **todas as pontas ativas**. Se a soma for **múltiplo de 5 (e > 0)**, a dupla do jogador marca os pontos.

### Exemplos
- Pontas: L=3, R=2, T=0, B=0 → soma = 5 → **+5 pts**
- Pontas: L=6, R=4 → soma = 10 → **+10 pts**
- Pontas: L=3, R=3 → soma = 6 → **não marca** (não é múltiplo de 5)

### Carroça na ponta

Se uma carroça está na ponta de um braço, o valor conta **em dobro** (representa as duas faces expostas).

Exemplo: mesa tem `left=4`, e a peça da ponta de `right` é `[3:3]` (carroça). Então:
- Soma = 4 (left) + 3×2 (right, carroça) = **10 → +10 pts**

### Caso especial — só a carroça central

Se só existe a carroça central (nenhum braço com peça), ela vale `a × 2` (as duas faces). Só pode gerar pontos se for `[0:0]`, `[5:5]` — sem efeito prático porque a primeira jogada já abre um braço.

## 6. Passe

Quando um jogador não pode jogar, ele **passa**. A sequência de passes consecutivos segue esta regra:

| Posição na sequência | Quem é | Efeito |
|----------------------|--------|--------|
| 1º passe | Adversário imediato de quem jogou | Dupla de quem jogou ganha **+20 pts** |
| 2º passe | Parceiro de quem jogou | "Nas costas" — **sem pontos** |
| 3º passe | Outro adversário | **Situação de galo** (ver §7) |
| 4º passe (quem jogou passa também) | Quem jogou a última peça | **Jogo bloqueado** (ver §8) |

A "**batida**" (quem abriu a rodada, marcada com 🎯) passa para o próximo jogador quando o portador passa.

## 7. Galo

O **galo** é a situação rara e de alta habilidade onde, após um jogador colocar uma peça, **todos os outros três jogadores passam em sequência** e a vez **volta para o jogador original**, que ainda tem peça jogável.

É chamado de "galo" porque é como cantar vitória — o jogador percebe que travou todo mundo e só ele consegue continuar a partida.

### Quando acontece objetivamente

Dado o estado da mesa, a peça que X vai jogar, e as mãos dos adversários, o galo **é determinístico**: ou os 3 próximos jogadores ficarão sem peça jogável, ou não. Não é sorte — é cálculo.

A habilidade do galo está em **contar as peças** (quais já saíram, quais os outros passaram em quais números) e **deduzir a mão dos outros** o suficiente para ter certeza.

### Ganhar o bônus — precisa anunciar antes

Para ganhar os **+50 pts** do galo, o jogador precisa **anunciar "galo!"** **antes** de jogar a peça.

| Cenário | Resultado |
|---------|-----------|
| **Anunciou** + galo aconteceu | ✅ **+50 pts** para a dupla do anunciante |
| **Anunciou** + algum adversário conseguiu jogar | ❌ **Galo falso** — dupla adversária ganha **+50 pts** |
| **Não anunciou** mas galo aconteceu | 😢 **Oportunidade perdida** — mostrar mensagem "Você tinha um galo aí!" (sem pontos) |
| **Não anunciou** e galo não aconteceu | Situação normal, nada acontece |

### Como o bot detecta galos

O engine expõe uma função para detectar galos **computacionalmente**:

```typescript
/**
 * Verifica se jogar `move` resultaria em galo:
 * os próximos 3 jogadores não terão peça jogável
 * E o próprio jogador ainda terá peça jogável após eles.
 *
 * Esta função precisa das mãos dos adversários para ser precisa.
 * Bots avançados usam isso diretamente. Bots iniciantes podem usar
 * uma versão com ruído (simula não ter contado direito).
 */
export function detectGalo(state: GameState, move: PlayMove): boolean;
```

#### Comportamento por nível de bot

| Nível | Comportamento |
|-------|---------------|
| **Iniciante** | Raramente anuncia — "pega mais leve", deixa passar oportunidades |
| **Manauara** | Detecta a maioria dos galos reais, anuncia na maioria (70–80%) |
| **Lenda** | Sempre anuncia quando detecta. Nunca anuncia quando não é galo. |

Bots **nunca** anunciam aleatoriamente (o MVP fazia isso com 3.5% de chance — **está errado**). A decisão tem que vir de `detectGalo()` do engine.

### Mensagem de "oportunidade perdida"

Quando um galo acontece sem ter sido anunciado (seja por humano ou bot iniciante), o engine deve registrar e exibir:

> 🐓 **Você tinha um galo aí!** Se tivesse anunciado, dupla A ganharia +50 pts.

Isso ensina o jogador a identificar galos e vira um recurso de aprendizado (alinhado com a **Fase 6 — Tutorial e IA**).

## 8. Fim de rodada

Uma rodada acaba de duas formas:

### A. Dominó (batida)
Jogador fica sem peças. Dupla dele vence a rodada.

- **Dominó normal:** dupla ganha os pontos da **garagem** (ver abaixo)
- **Dominó de carroça:** última peça jogada é carroça → dupla ganha **+20 pts extra** + garagem

### B. Jogo fechado (blocked)
Nenhum jogador pode jogar (todos teriam que passar).

- Soma-se o total de peças de cada dupla (peças que sobraram nas mãos)
- Dupla com **menor soma** vence a rodada e ganha a garagem
- Se empatar → ninguém marca pontos, mas também ninguém "vence" (próxima rodada começa por quem tem [6:6])

### Garagem

A "garagem" é a soma dos valores das peças que **sobraram na mão da dupla perdedora**, arredondada para baixo ao múltiplo de 5 mais próximo.

```
garagem = floor(soma_peças_perdedora / 5) × 5
```

Exemplos:
- Dupla perdedora tem 23 pontos em peças → garagem = 20 pts para a vencedora
- Dupla perdedora tem 7 pontos → garagem = 5 pts

## 9. Fim da partida

- Quando uma dupla atinge ou ultrapassa o **limite** (50/100/150/200), a partida acaba.
- Não há "desempate" — quem cruzou primeiro vence.

---

## Glossário

| Termo | Significado |
|-------|-------------|
| **Carroça** | Peça com valores iguais (`[0:0]`, `[1:1]`, …, `[6:6]`) |
| **Ponta** | Valor exposto na extremidade de um braço (onde a próxima peça pode conectar) |
| **Braço** | Uma das 4 direções da mesa (left, right, top, bottom) |
| **Batida** | Quem abriu a rodada (ou recebeu a batida após o abridor passar) |
| **Dupla** | Par de jogadores aliados (A: Sul+Norte, B: Leste+Oeste) |
| **Garagem** | Pontos das peças na mão dos perdedores, arredondado ao múltiplo de 5 |
| **Galo** | Anúncio de que vai bater, gera bônus se confirmado |
| **Nas costas** | Segundo passe consecutivo da mesma dupla (não pontua para o adversário) |
