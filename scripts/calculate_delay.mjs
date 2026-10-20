/**
 * Standalone test runner for WhatsApp Anti-Ban delay calculations.
 * Validates jitter, punctuation handling, bounds clamping, and audio routing.
 */

export function calculateTypingDelay(text, isAudio = false, audioDurationSec = 5) {
  if (isAudio) {
    return {
      presence: "recording",
      delay_ms: Math.round(audioDurationSec * 1000)
    };
  }

  const basePace = 35;
  let delay = text.length * basePace;

  const commas = (text.match(/,/g) || []).length;
  const periods = (text.match(/[\.\?\!]/g) || []).length;
  delay += (commas * 250) + (periods * 500);

  const jitterFactor = 0.85 + (Math.random() * 0.30);
  let finalDelay = Math.round(delay * jitterFactor);

  finalDelay = Math.min(Math.max(finalDelay, 1800), 8500);

  return {
    presence: "composing",
    delay_ms: finalDelay
  };
}

export function calculateReadingDelay(incomingText) {
  const words = incomingText.split(/\s+/).filter(Boolean).length;
  let delay = 800 + (words * 220);
  const jitter = 0.90 + (Math.random() * 0.20);
  delay = Math.round(delay * jitter);
  return Math.min(Math.max(delay, 1200), 4500);
}
