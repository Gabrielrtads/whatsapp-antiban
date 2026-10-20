# 🛡️ WhatsApp Anti-Ban Protocol (`whatsapp-antiban`)

[![skills.sh compatible](https://img.shields.io/badge/skills.sh-compatible-6366f1?style=for-the-badge)](https://skills.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Zero-Dependency](https://img.shields.io/badge/Dependencies-Zero-emerald?style=for-the-badge)](#)
[![Gateway](https://img.shields.io/badge/Gateways-Evolution_API_|_Z--API_|_Baileys_|_Meta_Cloud-orange?style=for-the-badge)](#)

> **Stop losing WhatsApp numbers to instant bans in N8N and AI automations.**  
> A production-grade human behavior simulation protocol that introduces **jittered typing delays**, **delayed blue checkmarks (`markRead`)**, **presence states (`composing` / `recording`)**, and a **30-day chip warm-up ramp**.

---

## ⚡ The Problem: Why Automation Chips Get Banned

WhatsApp's automated anti-abuse algorithms flag accounts not by what they say, but **how they behave**:

```
❌ THE ROBOTIC PATTERN (BANNED IN 48H)
[Message Received] ──(0.01s)──> [Read / Blue Ticks] ──(0.1s)──> [Sends 500-char reply instantly]
```

When an account sends instant replies with no typing duration, marks messages as read in 10 milliseconds, or sends identical message hashes to dozens of contacts, **WhatsApp flags the session as an unauthorized bot**.

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

Never hook a brand new chip straight into high-volume automations. Follow this schedule to build domain trust with WhatsApp:

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

## 🛡️ Anti-Fingerprint Golden Rules

1. **Disable Auto-Read:** In your gateway dashboard, always disable automatic read receipts. Blue ticks must be triggered by your workflow after a realistic reading pause.
2. **Audio Presence:** If your AI sends voice notes (TTS), always set presence to `'recording'`, never `'composing'`.
3. **Use Spintax:** Never send identical text strings to multiple recipients simultaneously. Rotate greetings, sentence structures, and closings.
4. **Isolate Numbers:** Never use your primary customer support number for mass outbound campaigns.

---

## 📄 License

MIT License — Created with ❤️ by [Gabriel Toledo (@Gabrielrtads)](https://github.com/Gabrielrtads).
