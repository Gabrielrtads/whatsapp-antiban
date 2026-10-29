import { calculateTypingDelay, calculateReadingDelay } from "./calculate_delay.mjs";

console.log("--- WhatsApp Anti-Ban Delay Tests ---");

// Test 1: Short reply clamping (min 1800ms)
const shortTest = calculateTypingDelay("Ok");
console.log(`[Test 1] 'Ok' delay: ${shortTest.delay_ms}ms (presence: ${shortTest.presence})`);
if (shortTest.delay_ms < 1800) {
  throw new Error("Failed: Short reply did not clamp to min 1800ms");
}

// Test 2: Audio voice note routing
const audioTest = calculateTypingDelay("", true, 7.5);
console.log(`[Test 2] Audio 7.5s: ${audioTest.delay_ms}ms (presence: ${audioTest.presence})`);
if (audioTest.presence !== "recording" || audioTest.delay_ms !== 7500) {
  throw new Error("Failed: Audio test failed presence or duration match");
}

// Test 3: Reading delay bounds
const readTest = calculateReadingDelay("Olá tudo bem? Gostaria de saber o preço do corte de cabelo e barba.");
console.log(`[Test 3] Reading delay for 13 words: ${readTest}ms`);
if (readTest < 1200 || readTest > 4500) {
  throw new Error("Failed: Reading delay out of bounds");
}

console.log("✅ All WhatsApp Anti-Ban tests passed cleanly!");

await import('./test_workflow.mjs');
