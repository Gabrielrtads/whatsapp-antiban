/**
 * N8N Code Node: Dynamic Typing Delay & Presence Calculation
 * 
 * Paste this code into an N8N Code Node placed after your AI Agent
 * or LLM response node, and before the HTTP Request that sends the message.
 */

// Retrieve response text from previous node
const message = $json.ai_response?.text || $json.reply || $json.output || "";
const isAudio = $json.ai_response?.is_audio || false;

// Voice note handling: presence is 'recording' and delay matches audio duration
if (isAudio) {
  const audioDurationSec = $json.ai_response?.duration_seconds || 5;
  return {
    presence: "recording",
    delay_ms: Math.round(audioDurationSec * 1000),
    is_audio: true
  };
}

// 1. Base pace: 35ms per character (~35 WPM human typing cadence)
const basePace = 35;
let calculatedDelay = message.length * basePace;

// 2. Add realistic thinking pauses for punctuation marks
const commas = (message.match(/,/g) || []).length;
const periods = (message.match(/[\.\?\!]/g) || []).length;
calculatedDelay += (commas * 250) + (periods * 500);

// 3. Apply Gaussian jitter (±15% variance) so every message has unique timing
const jitterFactor = 0.85 + (Math.random() * 0.30);
let finalDelay = Math.round(calculatedDelay * jitterFactor);

// 4. Clamped boundaries:
// Minimum 1800ms (1.8s) - even for 'Ok' humans don't respond faster
// Maximum 8500ms (8.5s) - keeps UX responsive while appearing natural
finalDelay = Math.min(Math.max(finalDelay, 1800), 8500);

return {
  presence: "composing",
  delay_ms: finalDelay,
  character_count: message.length,
  estimated_wpm: Math.round((message.length / 5) / (finalDelay / 60000))
};
