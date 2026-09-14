import type { Candle, GannAngle, Pivot } from "./types.ts";

export function buildGannAngles(
  candles: Candle[],
  pivot: Pivot | null,
  priceUnit: number,
  angleSet: Array<[number, number]>,
): GannAngle[] {
  if (!pivot || candles.length === 0 || priceUnit <= 0) return [];
  const last = candles.length - 1;
  const bars = last - pivot.index;
  const sign = pivot.type === "low" ? 1 : -1;

  return angleSet.map(([rise, run]) => {
    const currentPrice = pivot.price + sign * (bars * priceUnit * rise) / run;
    return {
      id: `ang-${rise}x${run}-${pivot.index}`,
      pivot,
      rise,
      run,
      label: `${rise}×${run}`,
      currentPrice,
    };
  });
}

export function priceOnAngle(
  price: number,
  angles: GannAngle[],
  atr: number,
): GannAngle | null {
  const tol = Math.max(atr * 0.4, price * 0.001);
  let best: GannAngle | null = null;
  let bestDist = Infinity;
  for (const a of angles) {
    const d = Math.abs(a.currentPrice - price);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  if (!best || bestDist > tol) return null;
  return best;
}

export function anglePriceAt(
  pivot: Pivot,
  priceUnit: number,
  rise: number,
  run: number,
  index: number,
): number {
  const sign = pivot.type === "low" ? 1 : -1;
  const bars = index - pivot.index;
  return pivot.price + sign * (bars * priceUnit * rise) / run;
}
