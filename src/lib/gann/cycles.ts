import type { Candle, Pivot, TimeCycle } from "./types.ts";

export function buildTimeCycles(
  candles: Candle[],
  pivots: Pivot[],
  cycleSet: number[],
  showEighths: boolean,
): TimeCycle[] {
  if (candles.length === 0) return [];
  const last = candles.length - 1;
  const cycles: TimeCycle[] = [];
  const anchors = pivots.slice(-6);

  for (const pivot of anchors) {
    for (const bars of cycleSet) {
      const index = pivot.index + bars;
      if (index < 0) continue;
      const time =
        index <= last
          ? candles[index].t
          : extrapolateTime(candles, index);
      const family: TimeCycle["family"] =
        bars === 144 || bars === 233 ? "fib" : "gann";
      cycles.push({
        id: `cyc-${pivot.index}-${bars}`,
        pivot,
        bars,
        index,
        time,
        label: `${bars}`,
        family,
        confluence: 0,
        inView: Math.abs(index - last) < 220,
      });
    }

    if (showEighths) {
      const span = Math.max(
        ...cycleSet.filter((c) => pivot.index + c <= last + 40),
        144,
      );
      for (const frac of [0.25, 0.5, 0.75]) {
        const bars = Math.round(span * frac);
        if (bars < 8) continue;
        const index = pivot.index + bars;
        cycles.push({
          id: `eighth-${pivot.index}-${frac}`,
          pivot,
          bars,
          index,
          time: index <= last ? candles[Math.min(index, last)].t : extrapolateTime(candles, index),
          label: `${frac * 8}/8`,
          family: "eighth",
          confluence: 0,
          inView: Math.abs(index - last) < 220,
        });
      }
    }
  }

  for (const c of cycles) {
    c.confluence = cycles.filter(
      (o) => o !== c && Math.abs(o.index - c.index) <= 2,
    ).length;
  }

  return cycles.sort((a, b) => a.index - b.index);
}

export function extrapolateTime(candles: Candle[], index: number): number {
  if (candles.length < 2) return Date.now();
  const dt = candles[candles.length - 1].t - candles[candles.length - 2].t;
  const last = candles[candles.length - 1];
  return last.t + dt * (index - (candles.length - 1));
}

export function upcomingCycles(cycles: TimeCycle[], lastIndex: number, within = 24): TimeCycle[] {
  return cycles
    .filter((c) => c.index >= lastIndex - 1 && c.index <= lastIndex + within)
    .sort((a, b) => a.index - lastIndex || b.confluence - a.confluence);
}
