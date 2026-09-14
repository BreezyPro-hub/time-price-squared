import type { Candle, Pivot, TimePriceSquare } from "./types.ts";

function boxId(pivot: Pivot, end: number): string {
  return `sq-${pivot.type}-${pivot.index}-${end}`;
}

export function findTimePriceSquares(
  candles: Candle[],
  pivots: Pivot[],
  priceUnit: number,
  tolerance: number,
  maxSquares: number,
): TimePriceSquare[] {
  if (candles.length === 0 || priceUnit <= 0) return [];
  const last = candles.length - 1;
  const squares: TimePriceSquare[] = [];
  const usedEnds = new Set<number>();

  const candidates = pivots.slice(-18);

  for (const pivot of candidates) {
    let best: TimePriceSquare | null = null;
    const direction: "up" | "down" = pivot.type === "low" ? "up" : "down";

    for (let i = pivot.index + 4; i <= last; i++) {
      const bar = candles[i];
      const extreme = direction === "up" ? bar.h : bar.l;
      const priceMove = Math.abs(extreme - pivot.price);
      const priceUnits = priceMove / priceUnit;
      const timeBars = i - pivot.index;
      if (timeBars < 4 || priceUnits < 2) continue;

      const ratio = Math.abs(priceUnits - timeBars) / Math.max(timeBars, priceUnits);
      if (ratio > tolerance) continue;

      const efficiency = 1 - ratio;
      const top = Math.max(pivot.price, extreme);
      const bottom = Math.min(pivot.price, extreme);
      const sq: TimePriceSquare = {
        id: boxId(pivot, i),
        pivot,
        startIndex: pivot.index,
        endIndex: i,
        projectedIndex: i,
        top,
        bottom,
        direction,
        status: "complete",
        priceMove,
        timeBars,
        priceUnits,
        efficiency,
        completion: 1,
        targetPrice: extreme,
      };

      if (!best || efficiency > best.efficiency) best = sq;
    }

    if (best && !usedEnds.has(best.endIndex)) {
      usedEnds.add(best.endIndex);
      squares.push(best);
    }
  }

  squares.sort((a, b) => b.efficiency - a.efficiency || b.endIndex - a.endIndex);
  const kept: TimePriceSquare[] = [];
  for (const sq of squares) {
    const overlaps = kept.some(
      (k) =>
        !(sq.endIndex < k.startIndex || k.endIndex < sq.startIndex) &&
        Math.abs(sq.top - k.top) / Math.max(sq.top, 1) < 0.04,
    );
    if (overlaps) continue;
    kept.push(sq);
    if (kept.length >= maxSquares) break;
  }
  kept.sort((a, b) => a.startIndex - b.startIndex);

  const lastPivot = pivots[pivots.length - 1];
  if (lastPivot) {
    const forming = projectFormingSquare(candles, lastPivot, priceUnit);
    if (forming) kept.push(forming);
  }

  return kept;
}

export function projectFormingSquare(
  candles: Candle[],
  pivot: Pivot,
  priceUnit: number,
): TimePriceSquare | null {
  const last = candles.length - 1;
  if (last <= pivot.index + 2 || priceUnit <= 0) return null;
  const direction: "up" | "down" = pivot.type === "low" ? "up" : "down";
  const bar = candles[last];
  const extreme = direction === "up" ? bar.h : bar.l;
  const priceMove = Math.abs(extreme - pivot.price);
  const priceUnits = priceMove / priceUnit;
  const timeBars = last - pivot.index;
  if (priceUnits < 1.2 && timeBars < 6) return null;

  const neededBars = Math.max(timeBars, Math.round(priceUnits));
  const projectedIndex = pivot.index + neededBars;
  const targetMove = neededBars * priceUnit;
  const targetPrice = direction === "up" ? pivot.price + targetMove : pivot.price - targetMove;
  const completion = Math.min(1, Math.min(timeBars, priceUnits) / Math.max(timeBars, priceUnits, 1));
  const broken =
    (direction === "up" && bar.c < pivot.price) ||
    (direction === "down" && bar.c > pivot.price);

  return {
    id: `forming-${pivot.index}`,
    pivot,
    startIndex: pivot.index,
    endIndex: last,
    projectedIndex,
    top: Math.max(pivot.price, extreme, targetPrice),
    bottom: Math.min(pivot.price, extreme, targetPrice),
    direction,
    status: broken ? "broken" : "forming",
    priceMove,
    timeBars,
    priceUnits,
    efficiency: 1 - Math.abs(priceUnits - timeBars) / Math.max(timeBars, priceUnits, 1),
    completion,
    targetPrice,
  };
}
