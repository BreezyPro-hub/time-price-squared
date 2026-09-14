import type { Decision, TimePriceSquare } from "@/lib/gann/types";

export function decisionSpeech(decision: Decision, symbol: string): string {
  const bias =
    decision.bias === "strong_long"
      ? "strong long"
      : decision.bias === "strong_short"
        ? "strong short"
        : decision.bias === "wait"
          ? "stand aside"
          : decision.bias;
  const next = decision.nextEvent
    ? decision.nextEvent.bars === 0
      ? `${decision.nextEvent.label} is now.`
      : `Next: ${decision.nextEvent.label} in ${decision.nextEvent.bars} bars.`
    : "";
  return `${symbol}. Bias ${bias}. ${decision.headline}. ${decision.reasons[0] ?? ""} ${next}`.replace(/\s+/g, " ").trim();
}

export function squareSpeech(square: TimePriceSquare): string {
  const dir = square.direction === "up" ? "advance" : "decline";
  if (square.status === "complete") {
    return `Time-price square complete on the ${dir}. ${square.timeBars} bars balanced ${square.priceUnits.toFixed(1)} price units. Watch for a turn.`;
  }
  if (square.status === "forming" && square.completion >= 0.85) {
    return `Forming ${dir} square is ${(square.completion * 100).toFixed(0)} percent complete. Time and price are nearly squared.`;
  }
  return "";
}

export class SpeechDesk {
  enabled = false;
  lastKey = "";
  private unlocked = false;

  unlock() {
    this.unlocked = true;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("Voice alerts on.");
    u.rate = 1;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  }

  speak(text: string, key: string) {
    if (!this.enabled || !this.unlocked || !text) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (key === this.lastKey) return;
    this.lastKey = key;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 0.95;
    u.volume = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /en-GB/i.test(v.lang) && /female|samantha|google/i.test(v.name)) ??
      voices.find((v) => /^en/i.test(v.lang));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  }

  stop() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  }
}

export const speechDesk = new SpeechDesk();
