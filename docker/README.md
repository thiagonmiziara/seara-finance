# Stack local — Evolution API + bot

Stack Docker para rodar a Evolution API localmente e validar a recepção de **texto**, **áudio** e **foto** antes de plugar no Supabase de produção.

## O que sobe

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `evolution-postgres` | (interna) | Postgres dedicado da Evolution |
| `evolution-redis` | (interna) | Cache da Evolution |
| `evolution-api` | 8080 | Evolution API + Manager web |
| `bot` | 3001 | Webhook receiver — classifica, baixa mídia, transcreve áudio (OpenAI Whisper) e descreve imagem (GPT-4o mini) |

## Subir

```bash
cd docker
cp .env.example .env
# Edite .env e ajuste pelo menos EVOLUTION_API_KEY (string aleatória ≥32 chars).
# Se quiser transcrição de áudio e visão computacional, adicione OPENAI_API_KEY.

docker compose up -d --build
docker compose logs -f bot
```

## Criar instância e parear

```bash
# carregar variáveis (zsh / bash)
set -a; source .env; set +a

# criar instância "dev"
curl -s -X POST "http://localhost:8080/instance/create" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"instanceName\": \"$EVOLUTION_INSTANCE\",
    \"qrcode\": true,
    \"integration\": \"WHATSAPP-BAILEYS\"
  }" | jq

# pegar QR Code (abra no navegador)
open "http://localhost:8080/manager"
# OU base64 direto pelo terminal:
curl -s "http://localhost:8080/instance/connect/$EVOLUTION_INSTANCE" \
  -H "apikey: $EVOLUTION_API_KEY" | jq -r '.base64' | sed 's/^data:image\/png;base64,//' | base64 -d > /tmp/qr.png && open /tmp/qr.png
```

Escaneie o QR com o WhatsApp do telefone (Configurações → Aparelhos conectados → Conectar aparelho).

## Verificar conexão

```bash
curl -s "http://localhost:8080/instance/connectionState/$EVOLUTION_INSTANCE" \
  -H "apikey: $EVOLUTION_API_KEY" | jq
# state deve estar "open"
```

## Testar

Mande pra esse número, do seu próprio WhatsApp:

1. **Texto** — qualquer mensagem. O bot responde com eco.
2. **Áudio** (gravar voz) — o bot baixa, salva em `/app/media/`, e:
   - Com `OPENAI_API_KEY` setada: transcreve e responde com o texto.
   - Sem chave: confirma recebimento + tamanho.
3. **Foto** — o bot baixa, salva e:
   - Com `OPENAI_API_KEY`: descreve em uma frase em português.
   - Sem chave: confirma recebimento + legenda.

Logs em tempo real:

```bash
docker compose logs -f bot
```

Mídia baixada (acessível pelo host):

```bash
docker compose exec bot ls -la /app/media
docker compose cp bot:/app/media ./media-snapshot
```

## Enviar mensagem programaticamente

```bash
curl -s -X POST "http://localhost:8080/message/sendText/$EVOLUTION_INSTANCE" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"number":"5511987654321","text":"Olá pelo Evolution!"}' | jq
```

## Parar / limpar

```bash
docker compose down            # para os containers
docker compose down -v          # para + apaga volumes (perde sessão Whatsapp e mídia)
```

## Ligar com o backend Supabase de produção (opcional, depois de testar local)

Quando quiser que a Evolution local mande webhooks para o `evolution-webhook`
das Edge Functions Supabase (em vez de para o bot local), troque
`WEBHOOK_GLOBAL_URL` no [docker-compose.yml](docker-compose.yml) por:

```
WEBHOOK_GLOBAL_URL: https://vuhbbxtxpewsjajmjost.supabase.co/functions/v1/evolution-webhook
```

E adicione um header secret. Como Evolution v2 não suporta header customizado
em webhook por env, você precisaria expor o bot como proxy ou usar a Evolution
em modo cloud — esse caminho está descrito em
[`../docs/architecture/overview.md`](../docs/architecture/overview.md).

## Troubleshooting

- **QR não aparece:** veja `docker compose logs evolution-api`. Reinicie só o serviço: `docker compose restart evolution-api`.
- **Webhook não chega no bot:** confirme `docker compose logs bot` e teste `curl http://localhost:3001/healthz` do host.
- **Bot recebe mas responde "não consegui baixar":** muito provavelmente a sessão da Evolution caiu. Reescaneie o QR.
- **`docker compose up` falha em `evolution-api`:** verifique se a versão da imagem (`atendai/evolution-api:v2.2.3`) ainda existe — atualize para a tag mais recente.
