import type { Candle, EngineSettings, Pivot } from "./types.ts";

export const DEFAULT_CYCLES = [45, 90, 144, 180, 270, 360];

export const DEFAULT_SETTINGS: EngineSettings = {
  pivotLeft: 5,
  pivotRight: 5,
  minPivotStrength: 0,
  priceUnitMode: "atr",
  priceUnitManual: 1,
  atrMult: 0.5,
  squareTolerance: 0.12,
  maxSquares: 6,
  cycleSet: DEFAULT_CYCLES,
  showEighths: true,
  so9Degrees: [45, 90, 180, 270, 360],
  angleSet: [
    [1, 1],
    [2, 1],
    [1, 2],
    [4, 1],
    [1, 4],
  ],
};

export function wilderAtr(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0;
  const n = Math.min(period, candles.length - 1);
  let atr = 0;
  for (let i = candles.length - n; i < candles.length; i++) {
    const prev = candles[i - 1] ?? candles[i];
    const tr = Math.max(
      candles[i].h - candles[i].l,
      Math.abs(candles[i].h - prev.c),
      Math.abs(candles[i].l - prev.c),
    );
    atr += tr;
  }
  return atr / n;
}

export function detectPivots(
  candles: Candle[],
  left: number,
  right: number,
): Pivot[] {
  const pivots: Pivot[] = [];
  if (candles.length < left + right + 1) return pivots;

  for (let i = left; i < candles.length - right; i++) {
    const mid = candles[i];
    let isHigh = true;
    let isLow = true;
    let highScore = 0;
    let lowScore = 0;
    for (let k = i - left; k <= i + right; k++) {
      if (k === i) continue;
      if (candles[k].h >= mid.h) isHigh = false;
      else highScore += 1;
      if (candles[k].l <= mid.l) isLow = false;
      else lowScore += 1;
    }
    if (isHigh) {
      pivots.push({
        index: i,
        time: mid.t,
        price: mid.h,
        type: "high",
        strength: highScore,
      });
    } else if (isLow) {
      pivots.push({
        index: i,
        time: mid.t,
        price: mid.l,
        type: "low",
        strength: lowScore,
      });
    }
  }
  return pivots;
}

export function majorPivots(pivots: Pivot[], candles: Candle[], keep = 8): Pivot[] {
  if (pivots.length <= keep) return pivots;
  const range =
    Math.max(...candles.map((c) => c.h)) - Math.min(...candles.map((c) => c.l)) || 1;
  const scored = pivots.map((p) => {
    const recency = p.index / Math.max(1, candles.length - 1);
    const excursion =
      p.type === "high"
        ? (p.price - candles[p.index].l) / range
        : (candles[p.index].h - p.price) / range;
    return { p, score: p.strength * 0.4 + recency * 2 + excursion * 6 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored
    .slice(0, keep)
    .map((s) => s.p)
    .sort((a, b) => a.index - b.index);
}

export function resolvePriceUnit(
  candles: Candle[],
  pivots: Pivot[],
  settings: EngineSettings,
): { atr: number; priceUnit: number } {
  const atr = wilderAtr(candles, 14);
  if (settings.priceUnitMode === "manual" && settings.priceUnitManual > 0) {
    return { atr, priceUnit: settings.priceUnitManual };
  }
  if (settings.priceUnitMode === "range" && pivots.length >= 2) {
    const last = pivots[pivots.length - 1];
    const prev = pivots[pivots.length - 2];
    const bars = Math.max(1, last.index - prev.index);
    const move = Math.abs(last.price - prev.price);
    return { atr, priceUnit: Math.max(move / bars, atr * 0.15) };
  }
  const unit = Math.max(atr * settings.atrMult, Number.EPSILON);
  return { atr, priceUnit: unit };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
