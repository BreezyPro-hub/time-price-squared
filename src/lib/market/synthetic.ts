import type { Candle } from "@/lib/gann/types";

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE: Record<string, number> = {
  BTCUSDT: 64200, ETHUSDT: 3120, SOLUSDT: 148, XAUUSDT: 2380,
  NIFTY: 24850, BANKNIFTY: 51200, GIFTNIFTY: 24850,
  CRUDEOIL: 6200, GOLD: 72000, USOIL: 78,
  RELIANCE: 2950, TCS: 4100, HDFCBANK: 1680, INFY: 1880,
  ICICIBANK: 1250, SBIN: 820, BHARTIARTL: 1650, ITC: 480,
  LT: 3600, AXISBANK: 1150, KOTAKBANK: 1780, SPX: 5620, EURUSD: 1.084,
};

/** Geometric random walk with reversals planted on Gann counts so the desk always has squares to show. */
export function generateSynthetic(symbol: string, interval: string, count = 420): Candle[] {
  const rand = mulberry32(hash(`${symbol}:${interval}`));
  const start = BASE[symbol] ?? 100;
  const stepMs: Record<string, number> = {
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "1w": 7 * 24 * 60 * 60 * 1000,
  };
  const dt = stepMs[interval] ?? 60 * 60 * 1000;
  const t0 = 1_725_000_000_000 - count * dt;
  const vol = start * 0.0042;
  const reversalBars = new Set([45, 90, 144, 180, 225, 270, 324, 360]);

  const candles: Candle[] = [];
  let price = start;
  let drift = 0.18;

  for (let i = 0; i < count; i++) {
    if (reversalBars.has(i % 360) || reversalBars.has(i)) drift *= -1;
    const shock = (rand() - 0.48) * vol * 1.6;
    const wave = Math.sin(i / 21) * vol * 0.6;
    price = Math.max(start * 0.35, price + drift * vol + shock + wave);
    const spread = vol * (0.6 + rand());
    const o = price + (rand() - 0.5) * spread * 0.4;
    const c = price;
    const h = Math.max(o, c) + rand() * spread;
    const l = Math.min(o, c) - rand() * spread;
    candles.push({
      t: t0 + i * dt,
      o,
      h,
      l,
      c,
      v: 800 + rand() * 4200,
    });
  }
  return candles;
}
