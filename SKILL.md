---
name: whatsapp-antiban
version: 1.0.0
description: "Human behavior simulation & ban prevention protocol for WhatsApp automations (N8N, Meta Cloud API, Evolution API, Baileys, Z-API). Dynamic typing pace, delayed read receipts, Gaussian jitter, and chip warm-up schedules."
category: automation
tags: [whatsapp, n8n, antiban, automation, evolution-api, baileys, stealth, ai-agents]
---

# 🛡️ WhatsApp Anti-Ban Protocol (`whatsapp-antiban`)

A battle-tested protocol designed for AI agents and automation developers to eliminate ban risks on WhatsApp when operating through **N8N**, **Evolution API**, **Z-API**, **Baileys**, or **Meta Cloud API**.

> [!IMPORTANT]
> **Why Bots Get Banned:**  
> WhatsApp's spam detection algorithms look for unnatural behavioral signatures:
> 1. **Zero latency reading:** Blue ticks appearing 10ms after message delivery.
> 2. **Superhuman typing:** Sending a 400-character paragraph in 0.2 seconds without a `composing` state.
> 3. **Fixed timing intervals:** Exactly 3.000s delay on every message (robotic flat timing).
> 4. **Identical message hashes:** Sending the exact same string to multiple recipients.
> 5. **Cold chip spikes:** Going from 0 to 200 messages/day on a freshly activated SIM card.

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

Fresh SIM cards or accounts reactivated after being offline **must never start on full automation volume**. Follow this strict schedule:

| Phase | Timeline | Volume Cap | Permitted Behavior |
|---|---|---|---|
| **Phase 1: Incubation** | Days 1 to 5 | 0 automated msgs | **100% Manual.** Chat with 5-10 warm family/friends. Ensure mutual address book saves. Join 2-3 active groups. |
| **Phase 2: Inbound Only** | Days 6 to 10 | Max 30 chats/day | **Inbound traffic only.** AI replies only when the customer starts the conversation. Zero cold outbound outreach. |
| **Phase 3: Controlled Scaling**| Days 11 to 20| +20% every 3 days | Enable mixed media (text + occasional voice notes). Keep outbound messages to warm leads only. |
| **Phase 4: Full Production** | Day 21+ | Scaled capacity | Max 150-300 outbound/day per instance. Active health & ban monitoring. |

---

## 🔀 5. Content Spintax & Variation Rules

Sending the exact same string to multiple recipients triggers automated hash-matching spam filters.

### Golden Rules:
1. **Dynamic Greetings:** Rotate randomly between `"Olá"`, `"Oi"`, `"Tudo bem?"`, `"Como vai?"`, `"Opa"`.
2. **Dynamic Closings:** Alternate between `"Abraço"`, `"Qualquer dúvida estou à disposição"`, `"Até logo"`, `"Combinado!"`.
3. **Spintax Syntax in Templates:**
   ```
   {Olá|Oi|Como vai}, {tudo bem?|como você está?} Vi que você {solicitou|pediu|se interessou pelo} agendamento.
   ```
4. **Personalization Anchor:** Always inject the recipient's first name (`{{ $json.first_name }}`) to guarantee distinct sha256 message hashes.

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

1. **Never blast identical messages** to >10 contacts simultaneously.
2. **Never send unsolicited cold links** (links trigger high-risk spam filters if the recipient hasn't saved your number).
3. **Never reuse the customer support / AI reception chip** for bulk outbound marketing. Separate customer support from marketing.
4. **If mass outbound (>300/day) is required**, migrate to **Meta Cloud API (Official)** to eliminate infrastructure ban risks permanently.
