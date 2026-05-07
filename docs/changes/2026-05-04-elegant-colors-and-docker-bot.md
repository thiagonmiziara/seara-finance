# Cores elegantes + stack local Docker da Evolution + bot multimídia

- **Data:** 2026-05-04
- **Autor:** equipe
- **Tipo:** feature + design + infra
- **Impacto:** médio (visual e nova stack opcional para dev)

## Contexto

Duas frentes:

1. **Visual:** trocar o emerald saturado por uma paleta mais sofisticada, mantendo o DNA verde de produto financeiro mas elevando o tom para "premium".
2. **Pipeline WhatsApp local:** sem isso não dá pra validar se o bot entende texto / áudio / foto antes de subir pra produção.

## O que mudou

### Cores — paleta "forest + champagne"

- [`src/index.css`](../../src/index.css) — substituído todo o conjunto de tokens light e dark:
  - **Primary:** `hsl(162 50% 26%)` (forest emerald) no light / `hsl(162 52% 56%)` no dark.
  - **Background light:** ivory (`hsl(36 28% 98%)`) — papel premium.
  - **Background dark:** slate-emerald profundo (`hsl(165 24% 7%)`).
  - Novos tokens **`--gold`** / **`--gold-foreground`** com utilitários `.text-gold`, `.bg-gold`, `.ring-gold`.
  - `--brand-gradient` agora combina o primary com o gold para um halo sutil.
  - `gradient-text` reescrito com nova interpolação primary → gold → primary.
  - Sombras recalibradas para tons de verde-grafite (mais elegantes que zinc puro).
- [`tailwind.config.js`](../../tailwind.config.js) — escala `brand` redesenhada (forest progression) e nova escala `gold` ligada aos tokens de tema.
- [`src/components/auth/LoginScreen.tsx`](../../src/components/auth/LoginScreen.tsx):
  - Logo container em `bg-primary` (não mais zinc-900).
  - Links "criar conta", "esqueci senha", "voltar para login" agora usam `text-primary` (escolhem cor do tema).

### Stack local — Evolution API via Docker

Pasta nova [`docker/`](../../docker/):

- [`docker-compose.yml`](../../docker/docker-compose.yml) — 4 serviços:
  1. `evolution-postgres` (Postgres 16) — persistência da Evolution.
  2. `evolution-redis` (Redis 7) — cache.
  3. `evolution-api` (`atendai/evolution-api:v2.2.3`) na porta **8080** — API + Manager web.
  4. `bot` na porta **3001** — webhook receiver.
- [`.env.example`](../../docker/.env.example) — `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, credenciais Postgres internas, `OPENAI_API_KEY` opcional.
- [`README.md`](../../docker/README.md) — passo-a-passo: subir, criar instância, escanear QR, testar texto/áudio/foto, parar/limpar.

### Bot local multimídia

Pasta nova [`bot/`](../../bot/):

- [`src/index.ts`](../../bot/src/index.ts) — Express + TypeScript. Para cada `messages.upsert` ele:
  1. **Classifica** o tipo (`text` / `audio` / `image` / `video` / `document` / `sticker` / `location` / `contact` / `reaction`).
  2. **Para mídia:** baixa via `POST /chat/getBase64FromMediaMessage/{instance}` da Evolution e salva em `/app/media/`.
  3. **Para áudio com `OPENAI_API_KEY` setada:** transcreve via Whisper (`whisper-1`, `language=pt`).
  4. **Para imagem com `OPENAI_API_KEY` setada:** descreve em uma frase via GPT-4o-mini (vision); prompt já preparado para detectar comprovante de pagamento.
  5. **Responde no WhatsApp** confirmando o que entendeu.
- [`Dockerfile`](../../bot/Dockerfile), [`tsconfig.json`](../../bot/tsconfig.json), [`package.json`](../../bot/package.json) — runtime Node 20 + `tsx`.

## Como testar (resumo do README)

```bash
cd docker
cp .env.example .env
# editar EVOLUTION_API_KEY (string aleatória ≥32 chars), opcional OPENAI_API_KEY
docker compose up -d --build

# criar instância e ver QR
set -a; source .env; set +a
curl -s -X POST "http://localhost:8080/instance/create" \
  -H "apikey: $EVOLUTION_API_KEY" -H "Content-Type: application/json" \
  -d "{\"instanceName\":\"$EVOLUTION_INSTANCE\",\"qrcode\":true,\"integration\":\"WHATSAPP-BAILEYS\"}"
open "http://localhost:8080/manager"  # escaneia o QR

docker compose logs -f bot
```

Mande um texto, um áudio (gravar nota de voz) e uma foto pro número conectado — o bot responde e loga tudo.

## Pendências

- Atualizar restante de classes hardcoded `emerald-*` para tokens `primary` / `gold` em componentes que ainda usam Tailwind emerald (não quebrou nada — só não puxa o novo tema). Lista em `git grep emerald- src/`.
- Adicionar Dependabot/renovate para a tag `atendai/evolution-api:v2.2.3` (atualizar manualmente quando sair release).
- Decidir se vamos manter o bot local para dev e usar Edge Functions para prod, ou refatorar para Edge Functions servirem também ao bot local via `supabase functions serve`.

## Referências

- Evolution API docs: https://doc.evolution-api.com/
- Whisper API: https://platform.openai.com/docs/guides/speech-to-text
