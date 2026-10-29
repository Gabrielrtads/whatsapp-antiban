---
name: whatsapp-antiban
version: 1.0.0
description: "Messaging cadence examples for consent-based WhatsApp automations (N8N, Meta Cloud API, Evolution API, Baileys, Z-API). Typing pace, delayed read receipts and presence states; no guarantee against account restrictions."
category: automation
tags: [whatsapp, n8n, antiban, automation, evolution-api, baileys, ai-agents]
---

# 🛡️ WhatsApp Anti-Ban Protocol (`whatsapp-antiban`)

A messaging cadence example for consent-based automations using **N8N**, **Evolution API**, **Z-API**, **Baileys**, or **Meta Cloud API**. Delays and content variation do not eliminate account restriction risks.

> [!IMPORTANT]
> Timing, presence and volume examples describe messaging experience, not verified detection signatures or methods for bypassing platform controls.

## Uso Legítimo

- Exija opt-in documentado de cada destinatário (data, origem e finalidade autorizada) antes de enviar mensagens. É proibido contatar quem não consentiu, usar listas compradas, enviar spam ou phishing.
- Implemente opt-out funcional e fácil, como “SAIR”; registre a revogação e bloqueie novos envios antes de qualquer automação. Uma conversa recebida não autoriza campanhas futuras.
- Cumpra a LGPD e os Termos do WhatsApp aplicáveis: finalidade, minimização, retenção e proteção dos dados. Spintax, atrasos e volumes não autorizam contornar controles da plataforma.
- O exemplo não implementa cadastro de consentimento ou lista de bloqueio. Integre essas verificações antes de leitura, presença e envio, antes de produção.

## Webhook autenticado obrigatório

Antes de produção, configure **Header Auth** no `Webhook Inbound` do template e selecione uma credencial do cofre do n8n com header dedicado (por exemplo, `X-Webhook-Token`) e segredo aleatório forte. Configure o mesmo header no gateway confiável e use HTTPS. Nunca grave o segredo no template, em URL, Git ou logs; nunca desative a autenticação. Teste que headers ausentes/incorretos são rejeitados sem executar nós posteriores.

O filtro aceita apenas envelope plano `body.event = "messages.upsert"`, `body.key.fromMe === false`, ID de mensagem não vazio, JID direto (`5–15 dígitos@s.whatsapp.net`) e texto em `body.message.conversation` com `messageType = "conversation"`, ou `body.message.extendedTextMessage.text` com `messageType = "extendedTextMessage"`. Descarta grupos, status, outros eventos e dados inválidos antes das ações externas. Outros envelopes, como `body.data`, arrays e JIDs alternativos, precisam de adaptação e testes explícitos.

O nó nativo `Deduplicate Messages` requer n8n **1.64.0+** e guarda os últimos **10.000 pares destinatário/ID** entre execuções. Use um workflow por instância do gateway. Histórico limitado não garante entrega única; valide persistência após reinício e reentregas simultâneas antes de produção. Para garantia sob concorrência, use reserva atômica persistente de IDs. Falhas posteriores podem deixar um ID registrado sem envio: não repita automaticamente envios de resultado incerto. Execute `node scripts/test_runner.mjs` localmente; importação e HTTP reais no n8n continuam necessários.

---

## 🧭 1. The 4-Stage Humanized Response Pipeline

When programming automated responses in N8N, AI agents must structure the message pipeline into 4 distinct phases:

```
[Inbound Message]
       │
       ▼
1. Reading Latency ──────────> Wait 1.5s - 3.5s (proportional to incoming text)
       │
       ▼
2. Mark As Read ─────────────> POST /chat/markRead (delayed blue checkmark)
       │
       ▼
3. Thinking & Presence ──────> Wait 0.5s - 1.2s, then POST /chat/sendPresence ('composing' or 'recording')
       │
       ▼
4. Dynamic Typing Delay ─────> Wait dynamic ms (35ms/char ± 15% Gaussian jitter)
       │
       ▼
[Send Final Message]
```

---

## ⚙️ 2. Dynamic Typing & Delay Formula

Never use flat delays. Humans type at variable speeds, pause at punctuation, and take longer to think on complex sentences.

### JavaScript Implementation for N8N Code Node:

```javascript
// N8N Code Node: Calculate Human Typing Delay
const message = $json.ai_response?.text || $json.reply || "";
const isAudio = $json.ai_response?.is_audio || false;

if (isAudio) {
  // If voice note: presence is 'recording' and delay matches audio duration
  const audioDurationSec = $json.ai_response?.duration_seconds || 5;
  return {
    presence: "recording",
    delay_ms: Math.round(audioDurationSec * 1000)
  };
}

// 1. Base pace: 35ms per character (~30-40 WPM typing speed)
const basePace = 35;
let calculatedDelay = message.length * basePace;

// 2. Punctuation thinking pauses:
const commas = (message.match(/,/g) || []).length;
const periods = (message.match(/[\.\?\!]/g) || []).length;
calculatedDelay += (commas * 250) + (periods * 500);

// 3. Gaussian human jitter (±15% variance):
const jitterFactor = 0.85 + (Math.random() * 0.30);
let finalDelay = Math.round(calculatedDelay * jitterFactor);

// 4. Clamped boundaries:
// Minimum 1800ms (even for short replies like 'Ok')
// Maximum 8500ms (for longer texts; long responses feel natural within 8s)
finalDelay = Math.min(Math.max(finalDelay, 1800), 8500);

return {
  presence: "composing",
  delay_ms: finalDelay,
  character_count: message.length
};
```

---

## 👁️ 3. Delayed Reading Receipts (`markRead`)

### Configuration:
1. In your WhatsApp gateway (Evolution API / Z-API / Baileys), **DISABLE automatic read receipts (`autoRead: false`)**.
2. Calculate reading time based on the **incoming** message length:

```javascript
// N8N Code Node: Calculate Reading Latency
const incomingText = $json.body?.message?.conversation || $json.text || "";
const wordCount = incomingText.split(/\s+/).filter(Boolean).length;

// Average adult reads ~200-250 words per minute (approx 250ms per word)
// Clamp reading delay between 1.2s and 4.0s
const readDelay = Math.min(Math.max(wordCount * 250, 1200), 4000);

return {
  read_delay_ms: readDelay
};
```

3. Route:
   - `Wait` Node (duration: `{{ $json.read_delay_ms }}`)
   - HTTP Request Node (`POST /chat/markRead/{instance}`)

---

## 📅 4. The 30-Day SIM Card Warm-up Schedule (Ramp-Up Protocol)

This illustrative schedule does not establish safe volumes or platform trust. Every phase requires documented opt-in, working opt-out and compliance with applicable platform limits; lower limits take precedence.

| Phase | Timeline | Volume Cap | Permitted Behavior |
|---|---|---|---|
| **Phase 1: Incubation** | Days 1 to 5 | 0 automated msgs | **100% Manual.** Chat with 5-10 warm family/friends. Ensure mutual address book saves. Join 2-3 active groups. |
| **Phase 2: Inbound Only** | Days 6 to 10 | Max 30 chats/day | **Inbound traffic only.** AI replies only when the customer starts the conversation. Zero cold outbound outreach. |
| **Phase 3: Controlled Scaling**| Days 11 to 20| +20% every 3 days | Enable mixed media (text + occasional voice notes). Keep outbound messages to warm leads only. |
| **Phase 4: Full Production** | Day 21+ | Scaled capacity | Max 150-300 outbound/day per instance. Active health & ban monitoring. |

---

## 🔀 5. Content Spintax & Variation Rules

Use content variation for naturalness and relevance within an authorized conversation. Do not use spintax to evade detection filters or to contact recipients without consent.

### Golden Rules:
1. **Dynamic Greetings:** Rotate randomly between `"Olá"`, `"Oi"`, `"Tudo bem?"`, `"Como vai?"`, `"Opa"`.
2. **Dynamic Closings:** Alternate between `"Abraço"`, `"Qualquer dúvida estou à disposição"`, `"Até logo"`, `"Combinado!"`.
3. **Spintax Syntax in Templates:**
   ```
   {Olá|Oi|Como vai}, {tudo bem?|como você está?} Vi que você {solicitou|pediu|se interessou pelo} agendamento.
   ```
4. **Relevant Personalization:** Use the recipient's first name only when appropriate and authorized; preserve the meaning and purpose of the message.

---

## 🔌 6. Gateway Endpoints Reference

### Evolution API (v1 / v2)
* **Presence:** `POST /chat/sendPresence/{instance}`
  ```json
  {
    "number": "{{ $json.phone }}",
    "presence": "composing",
    "delay": 1200
  }
  ```
* **Mark Read:** `POST /chat/markRead/{instance}`
  ```json
  {
    "readMessages": [
      {
        "id": "{{ $json.message_id }}",
        "fromMe": false,
        "remoteJid": "{{ $json.remoteJid }}"
      }
    ]
  }
  ```

### Z-API
* **Presence:** `POST /messages/send-presence` (`{ "phone": "...", "presence": "composing" }`)
* **Mark Read:** `POST /messages/read-message` (`{ "messageId": "...", "phone": "..." }`)

---

## 🛑 7. Red Lines (Never Do This)

1. **Never contact recipients without documented opt-in**, regardless of volume or message variation.
2. **Never ignore opt-out requests** or send unsolicited messages or links.
3. **Never reuse the customer support / AI reception chip** for bulk outbound marketing. Separate customer support from marketing.
4. **Use official WhatsApp interfaces where applicable** and comply with their terms and messaging limits. No gateway or volume guarantees immunity from restrictions.
