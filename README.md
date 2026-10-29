# 🛡️ WhatsApp Anti-Ban Protocol (`whatsapp-antiban`)

[![skills.sh compatible](https://img.shields.io/badge/skills.sh-compatible-6366f1?style=for-the-badge)](https://skills.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Zero-Dependency](https://img.shields.io/badge/Dependencies-Zero-emerald?style=for-the-badge)](#)
[![Gateway](https://img.shields.io/badge/Gateways-Evolution_API_|_Z--API_|_Baileys_|_Meta_Cloud-orange?style=for-the-badge)](#)

> A messaging cadence example for consent-based WhatsApp automations, with typing delays, read receipts and presence states. Timing and content variation do not guarantee protection against account restrictions.

## Uso Legítimo

- Exija opt-in documentado do destinatário, com data, origem e finalidade autorizada, antes de enviar mensagens. É proibido usar este material para contatar quem não consentiu, inclusive listas compradas, spam ou phishing.
- Implemente opt-out funcional e fácil (por exemplo, “SAIR”): registre a revogação e bloqueie novos envios antes de qualquer automação. Uma mensagem recebida não autoriza campanhas futuras.
- Cumpra a LGPD e os Termos do WhatsApp aplicáveis, incluindo finalidade, minimização, retenção e proteção dos dados. Cadência, spintax e limites de volume não substituem essas obrigações nem autorizam contornar controles da plataforma.
- O template não implementa cadastro de consentimento nem lista de bloqueio: integre essas verificações antes das ações de leitura, presença e envio, antes de usar em produção.

## Webhook: configuração obrigatória antes de produção

O arquivo `examples/n8n-workflow-template.json` exige **Header Auth** no nó `Webhook Inbound`. Crie e selecione uma credencial **Header Auth** no cofre do n8n, com nome de header dedicado (por exemplo, `X-Webhook-Token`) e segredo aleatório forte; configure o mesmo header somente no gateway confiável. Use HTTPS. Nunca coloque o segredo no JSON, na URL, no Git ou em logs. Sem credencial válida o webhook deve rejeitar a requisição; não altere a autenticação para `None`. Antes de ativar, confirme que chamadas sem header ou com valor incorreto são rejeitadas e não executam nenhum nó posterior.

O filtro aceita somente o envelope plano `{ event: "messages.upsert", messageType: "conversation", key: { id, fromMe: false, remoteJid }, message: { conversation: "texto" } }`, ou `messageType: "extendedTextMessage"` com `message.extendedTextMessage.text`. Somente JIDs telefônicos diretos (`5–15 dígitos@s.whatsapp.net`) são aceitos; grupos, status, outros eventos e formatos ausentes/malformados são descartados. Gateways com `body.data`, arrays ou JIDs alternativos precisam de adaptação e testes explícitos antes do uso; o exemplo não aceita esses formatos automaticamente.

O nó `Deduplicate Messages` requer n8n **1.64.0 ou posterior** e mantém os últimos **10.000 pares destinatário/ID** entre execuções, antes de qualquer efeito externo. Use um workflow por instância do gateway. IDs removidos do histórico podem voltar a ser processados. Antes de produção, valide persistência após reinício e reentregas simultâneas na sua instalação; se precisar de garantia sob concorrência, use uma reserva atômica persistente de IDs. Uma falha posterior pode deixar o ID registrado sem envio: não repita automaticamente um envio de resultado incerto.

Validação local: `node scripts/test_runner.mjs` (testes de atraso e regressão do template; não substituem a importação e os testes HTTP numa instância n8n).

---

## ⚡ Messaging Experience

Instant automated actions can create a confusing messaging experience:

```
EXAMPLE OF INSTANT AUTOMATED ACTIONS
[Message Received] ──(0.01s)──> [Read / Blue Ticks] ──(0.1s)──> [Sends 500-char reply instantly]
```

Delays and presence states can improve pacing. They do not establish consent, platform compliance or account safety.

---

## 💡 The Solution: 4-Stage Humanized Response Pipeline

`whatsapp-antiban` teaches your AI agents and N8N workflows to mirror genuine human messaging cadences:

```
                      ┌──> 1. Reading Delay (1.2s - 4.0s based on inbound text)
                      ├──> 2. Delayed Read Receipt (POST /chat/markRead)
[Inbound Message] ────┼──> 3. Thinking & Presence (POST /chat/sendPresence 'composing')
                      └──> 4. Dynamic Typing (35ms/char + Gaussian Jitter + Punctuation)
                                           │
                                           ▼
                             [Deliver Final Message]
```

---

## 🚀 Quick Install (Via skills.sh)

Install this skill into your favorite AI coding assistant (Claude Code, Cursor, Codex, Antigravity):

```bash
npx skills add Gabrielrtads/whatsapp-antiban
```

---

## 🧩 N8N Code Node: Dynamic Typing Calculation

Copy and paste this snippet directly into an **N8N Code Node** right after your AI response node:

```javascript
// N8N Code Node: Calculate Human Typing Delay & Presence
const message = $json.ai_response?.text || $json.reply || "";
const isAudio = $json.ai_response?.is_audio || false;

if (isAudio) {
  const audioDurationSec = $json.ai_response?.duration_seconds || 5;
  return {
    presence: "recording",
    delay_ms: Math.round(audioDurationSec * 1000)
  };
}

// 1. Base pace: 35ms per character (~30-40 WPM)
const basePace = 35;
let calculatedDelay = message.length * basePace;

// 2. Punctuation thinking pauses:
const commas = (message.match(/,/g) || []).length;
const periods = (message.match(/[\.\?\!]/g) || []).length;
calculatedDelay += (commas * 250) + (periods * 500);

// 3. Gaussian human jitter (±15% variance):
const jitterFactor = 0.85 + (Math.random() * 0.30);
let finalDelay = Math.round(calculatedDelay * jitterFactor);

// 4. Clamped boundaries: 1.8s min, 8.5s max
finalDelay = Math.min(Math.max(finalDelay, 1800), 8500);

return {
  presence: "composing",
  delay_ms: finalDelay,
  character_count: message.length
};
```

---

## 📅 The 30-Day SIM Card Warm-Up Schedule

This illustrative ramp is not a safe-volume allowance or a way to gain platform trust. Every phase requires documented opt-in, working opt-out and compliance with the platform's applicable limits; lower limits take precedence.

| Phase | Timeline | Volume Cap | Permitted Behavior |
|---|---|---|---|
| **Phase 1: Incubation** | Days 1 to 5 | 0 automated msgs | **100% Manual.** Converse with 5-10 warm contacts. Mutual address book saves. Join 2-3 active groups. |
| **Phase 2: Inbound Only** | Days 6 to 10 | Max 30 chats/day | **Inbound only.** AI replies only when the client initiates. Zero cold outreach. |
| **Phase 3: Controlled Scaling** | Days 11 to 20 | +20% every 3 days | Enable mixed media (text + voice). Warm outbound leads only. |
| **Phase 4: Full Production** | Day 21+ | Scaled capacity | Max 150-300 outbound/day per instance. Active health & ban monitoring. |

---

## 🔌 Supported Gateways & Endpoints

| Gateway | Presence Endpoint | Read Receipt Endpoint |
|---|---|---|
| **Evolution API (v1 / v2)** | `POST /chat/sendPresence/{instance}` | `POST /chat/markRead/{instance}` |
| **Z-API** | `POST /messages/send-presence` | `POST /messages/read-message` |
| **Baileys (Direct)** | `sock.sendPresenceUpdate('composing', jid)` | `sock.readMessages([key])` |
| **Meta Cloud API** | Automatic state handling | `POST /{message-id}/status` |

---

## 🛡️ Messaging Experience Rules

1. **Disable Auto-Read:** In your gateway dashboard, always disable automatic read receipts. Blue ticks must be triggered by your workflow after a realistic reading pause.
2. **Audio Presence:** If your AI sends voice notes (TTS), always set presence to `'recording'`, never `'composing'`.
3. **Content variation for naturalness:** Optionally vary greetings and closings to fit the conversation. Spintax must not be used to evade detection filters or contact people without consent.
4. **Isolate Numbers:** Never use your primary customer support number for mass outbound campaigns.

---

## 📄 License

MIT License — Created with ❤️ by [Gabriel Toledo (@Gabrielrtads)](https://github.com/Gabrielrtads).
