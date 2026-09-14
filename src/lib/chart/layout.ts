import type { Candle } from "@/lib/gann/types";

export type View = { start: number; end: number };

export type ChartLayout = {
  width: number;
  height: number;
  plotX: number;
  plotY: number;
  plotW: number;
  plotH: number;
  volH: number;
  padR: number;
  padB: number;
  minP: number;
  maxP: number;
  barW: number;
  view: View;
};

export function makeLayout(
  width: number,
  height: number,
  candles: Candle[],
  view: View,
  extraPrices: number[],
): ChartLayout {
  const padL = 8;
  const padR = 64;
  const padT = 12;
  const padB = 28;
  const volH = Math.max(28, Math.min(56, height * 0.12));
  const plotX = padL;
  const plotY = padT;
  const plotW = Math.max(10, width - padL - padR);
  const plotH = Math.max(10, height - padT - padB - volH);
  const start = Math.max(0, Math.min(view.start, candles.length - 2));
  const end = Math.max(start + 1, Math.min(view.end, candles.length - 1));
  const slice = candles.slice(start, end + 1);
  let minP = Infinity;
  let maxP = -Infinity;
  for (const c of slice) {
    minP = Math.min(minP, c.l);
    maxP = Math.max(maxP, c.h);
  }
  for (const p of extraPrices) {
    if (!Number.isFinite(p)) continue;
    if (p > minP * 0.7 && p < maxP * 1.35) {
      minP = Math.min(minP, p);
      maxP = Math.max(maxP, p);
    }
  }
  if (!Number.isFinite(minP)) {
    minP = 0;
    maxP = 1;
  }
  const pad = (maxP - minP) * 0.08 || 1;
  minP -= pad;
  maxP += pad;
  const count = end - start + 1;
  const barW = plotW / count;
  return {
    width,
    height,
    plotX,
    plotY,
    plotW,
    plotH,
    volH,
    padR,
    padB,
    minP,
    maxP,
    barW,
    view: { start, end },
  };
}

export function xAt(layout: ChartLayout, index: number): number {
  return layout.plotX + (index - layout.view.start + 0.5) * layout.barW;
}

export function yAt(layout: ChartLayout, price: number): number {
  const { minP, maxP, plotY, plotH } = layout;
  return plotY + ((maxP - price) / (maxP - minP)) * plotH;
}

export function indexAt(layout: ChartLayout, x: number): number {
  const i = Math.round((x - layout.plotX) / layout.barW - 0.5) + layout.view.start;
  return Math.max(layout.view.start, Math.min(layout.view.end, i));
}

export function priceAt(layout: ChartLayout, y: number): number {
  const t = (y - layout.plotY) / layout.plotH;
  return layout.maxP - t * (layout.maxP - layout.minP);
}
