/**
 * N8N Code Node: Reading Latency Calculation (Pre-markRead)
 * 
 * Paste this code into an N8N Code Node placed right after the Webhook
 * receives an inbound WhatsApp message, before calling POST /chat/markRead.
 */

// Retrieve incoming text
const incomingText = $json.body?.data?.message?.conversation 
  || $json.body?.message?.conversation 
  || $json.text 
  || "";

// Count words
const wordCount = incomingText.split(/\s+/).filter(Boolean).length;

// Average human adult reads 200-250 words per minute (approx 250ms per word)
// Add 800ms baseline reaction time (unlocking phone, noticing notification)
let readingDelay = 800 + (wordCount * 220);

// Add natural human jitter (±10%)
const jitter = 0.90 + (Math.random() * 0.20);
readingDelay = Math.round(readingDelay * jitter);

// Clamp bounds:
// Min 1200ms (1.2s) - never mark as read in under 1 second
// Max 4500ms (4.5s) - even for long paragraphs, doesn't stall execution
readingDelay = Math.min(Math.max(readingDelay, 1200), 4500);

return {
  read_delay_ms: readingDelay,
  incoming_words: wordCount
};
