import type { EngineResult } from "@/lib/gann/types";
import { formatPrice, formatTime } from "@/lib/utils";
import { anglePriceAt } from "@/lib/gann/angles";
import { type ChartLayout, xAt, yAt } from "./layout";
import { type ChartTheme, withAlpha } from "./theme";

export type Crosshair = { x: number; y: number; index: number } | null;

export type OverlayFlags = {
  squares: boolean;
  cycles: boolean;
  so9: boolean;
  angles: boolean;
  pivots: boolean;
};

export function drawChart(
  ctx: CanvasRenderingContext2D,
  layout: ChartLayout,
  engine: EngineResult,
  theme: ChartTheme,
  overlays: OverlayFlags,
  crosshair: Crosshair,
  interval: string,
  dpr: number,
) {
  const { width, height } = layout;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, width, height);

  drawGrid(ctx, layout, theme);

  ctx.save();
  ctx.beginPath();
  ctx.rect(layout.plotX, layout.plotY, layout.plotW, layout.plotH);
  ctx.clip();
  if (overlays.cycles) drawCycles(ctx, layout, engine, theme);
  if (overlays.so9) drawSo9(ctx, layout, engine, theme);
  if (overlays.squares) drawSquares(ctx, layout, engine, theme);
  if (overlays.angles) drawAngles(ctx, layout, engine, theme);
  drawCandles(ctx, layout, engine, theme);
  if (overlays.pivots) drawPivots(ctx, layout, engine, theme);
  ctx.restore();

  drawVolume(ctx, layout, engine, theme);
  drawLastPrice(ctx, layout, engine, theme);
  drawAxes(ctx, layout, engine, theme, interval);
  if (crosshair) drawCrosshair(ctx, layout, engine, theme, crosshair, interval);
}

function drawGrid(ctx: CanvasRenderingContext2D, layout: ChartLayout, theme: ChartTheme) {
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  const steps = 6;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const y = layout.plotY + (layout.plotH / steps) * i;
    ctx.moveTo(layout.plotX, y);
    ctx.lineTo(layout.plotX + layout.plotW, y);
  }
  const bars = layout.view.end - layout.view.start + 1;
  const xStep = Math.max(8, Math.round(bars / 8));
  for (let i = layout.view.start; i <= layout.view.end; i += xStep) {
    const x = xAt(layout, i);
    ctx.moveTo(x, layout.plotY);
    ctx.lineTo(x, layout.plotY + layout.plotH);
  }
  ctx.stroke();
}

function drawSquares(ctx: CanvasRenderingContext2D, layout: ChartLayout, engine: EngineResult, theme: ChartTheme) {
  for (const sq of engine.squares) {
    const x1 = xAt(layout, sq.startIndex);
    const x2 = xAt(layout, sq.status === "forming" ? sq.projectedIndex : sq.endIndex);
    const y1 = yAt(layout, sq.top);
    const y2 = yAt(layout, sq.bottom);
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const w = Math.max(2, Math.abs(x2 - x1));
    const h = Math.max(2, Math.abs(y2 - y1));
    const fill =
      sq.status === "forming"
        ? withAlpha(theme.accent, 0.06)
        : sq.direction === "up"
          ? withAlpha(theme.bull, 0.12)
          : withAlpha(theme.bear, 0.12);
    const stroke =
      sq.status === "forming"
        ? withAlpha(theme.accent, 0.55)
        : sq.direction === "up"
          ? theme.bull
          : theme.bear;
    ctx.fillStyle = fill;
    ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = sq.status === "forming" ? 1 : 1.25;
    ctx.setLineDash(sq.status === "forming" ? [5, 4] : []);
    ctx.strokeRect(left, top, w, h);
    ctx.setLineDash([]);

    if (sq.status === "forming") {
      const ty = yAt(layout, sq.targetPrice);
      ctx.strokeStyle = withAlpha(theme.accent, 0.7);
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, ty);
      ctx.lineTo(x2, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = withAlpha(theme.fg, 0.75);
    ctx.font = "500 10px IBM Plex Sans, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const tag =
      sq.status === "forming"
        ? `SQ ${(sq.completion * 100).toFixed(0)}%`
        : `SQ ${sq.timeBars}`;
    if (sq.status === "forming" || sq.endIndex >= layout.view.end - 80) {
      ctx.fillText(tag, left + 4, top - 3);
    }
  }
}

function drawCycles(ctx: CanvasRenderingContext2D, layout: ChartLayout, engine: EngineResult, theme: ChartTheme) {
  const last = engine.candles.length - 1;
  const labeled = new Set<number>();
  for (const c of engine.cycles) {
    if (c.index < layout.view.start - 2 || c.index > layout.view.end + 2) continue;
    const x = xAt(layout, c.index);
    if (x < layout.plotX || x > layout.plotX + layout.plotW) continue;
    const strong = c.confluence >= 1 || Math.abs(c.index - last) <= 1;
    ctx.strokeStyle = strong ? withAlpha(theme.accent, 0.7) : withAlpha(theme.cycle, 0.35);
    ctx.lineWidth = strong ? 1.5 : 1;
    ctx.setLineDash(c.family === "eighth" ? [2, 4] : [1, 5]);
    ctx.beginPath();
    ctx.moveTo(x, layout.plotY);
    ctx.lineTo(x, layout.plotY + layout.plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    const bucket = Math.round(x / 28);
    if (!labeled.has(bucket) && (strong || c.family === "gann")) {
      labeled.add(bucket);
      ctx.fillStyle = strong ? theme.fg : theme.muted;
      ctx.font = "500 9px IBM Plex Sans, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(c.label, x, layout.plotY + 2);
    }
  }
}

function drawSo9(ctx: CanvasRenderingContext2D, layout: ChartLayout, engine: EngineResult, theme: ChartTheme) {
  ctx.font = "500 9px IBM Plex Sans, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  for (const l of engine.so9) {
    const y = yAt(layout, l.price);
    if (y < layout.plotY || y > layout.plotY + layout.plotH) continue;
    ctx.strokeStyle = withAlpha(theme.accent, 0.28);
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(layout.plotX, y);
    ctx.lineTo(layout.plotX + layout.plotW, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.muted;
    ctx.fillText(`${l.degrees}°`, layout.plotX + 4, y - 2);
  }
}

function drawAngles(ctx: CanvasRenderingContext2D, layout: ChartLayout, engine: EngineResult, theme: ChartTheme) {
  if (!engine.lastPivot) return;
  for (const a of engine.angles) {
    const x1 = xAt(layout, a.pivot.index);
    const y1 = yAt(layout, a.pivot.price);
    const x2 = xAt(layout, layout.view.end);
    const p2 = anglePriceAt(a.pivot, engine.priceUnit, a.rise, a.run, layout.view.end);
    const y2 = yAt(layout, p2);
    ctx.strokeStyle = a.label === "1×1" ? withAlpha(theme.fg, 0.55) : withAlpha(theme.cycle, 0.4);
    ctx.lineWidth = a.label === "1×1" ? 1.4 : 1;
    ctx.setLineDash(a.label === "1×1" ? [] : [4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawCandles(ctx: CanvasRenderingContext2D, layout: ChartLayout, engine: EngineResult, theme: ChartTheme) {
  const w = Math.max(1, layout.barW * 0.62);
  for (let i = layout.view.start; i <= layout.view.end; i++) {
    const c = engine.candles[i];
    if (!c) continue;
    const x = xAt(layout, i);
    const bull = c.c >= c.o;
    ctx.strokeStyle = bull ? theme.bull : theme.bear;
    ctx.fillStyle = bull ? theme.bull : theme.bear;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, yAt(layout, c.h));
    ctx.lineTo(x, yAt(layout, c.l));
    ctx.stroke();
    const yb = yAt(layout, Math.max(c.o, c.c));
    const yh = Math.max(1, Math.abs(yAt(layout, c.o) - yAt(layout, c.c)));
    ctx.globalAlpha = bull ? 0.92 : 0.88;
    ctx.fillRect(x - w / 2, yb, w, yh);
    ctx.globalAlpha = 1;
  }
}

function drawVolume(ctx: CanvasRenderingContext2D, layout: ChartLayout, engine: EngineResult, theme: ChartTheme) {
  const { view } = layout;
  let maxV = 1;
  for (let i = view.start; i <= view.end; i++) maxV = Math.max(maxV, engine.candles[i]?.v ?? 0);
  const top = layout.plotY + layout.plotH + 4;
  const h = layout.volH - 6;
  const w = Math.max(1, layout.barW * 0.55);
  for (let i = view.start; i <= view.end; i++) {
    const c = engine.candles[i];
    if (!c) continue;
    const vh = (c.v / maxV) * h;
    const x = xAt(layout, i);
    ctx.fillStyle = c.c >= c.o ? withAlpha(theme.bull, 0.28) : withAlpha(theme.bear, 0.28);
    ctx.fillRect(x - w / 2, top + h - vh, w, vh);
  }
}

function drawPivots(ctx: CanvasRenderingContext2D, layout: ChartLayout, engine: EngineResult, theme: ChartTheme) {
  for (const p of engine.pivots) {
    if (p.index < layout.view.start || p.index > layout.view.end) continue;
    const x = xAt(layout, p.index);
    const y = yAt(layout, p.price);
    ctx.fillStyle = p.type === "low" ? theme.bull : theme.bear;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLastPrice(ctx: CanvasRenderingContext2D, layout: ChartLayout, engine: EngineResult, theme: ChartTheme) {
  const last = engine.candles[engine.candles.length - 1];
  if (!last) return;
  const y = yAt(layout, last.c);
  if (y < layout.plotY || y > layout.plotY + layout.plotH) return;
  ctx.strokeStyle = withAlpha(theme.fg, 0.35);
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(layout.plotX, y);
  ctx.lineTo(layout.plotX + layout.plotW, y);
  ctx.stroke();
  ctx.setLineDash([]);
  const label = formatPrice(last.c);
  ctx.font = "600 11px IBM Plex Sans, sans-serif";
  const tw = ctx.measureText(label).width + 10;
  const tx = layout.plotX + layout.plotW + 4;
  const bull = last.c >= last.o;
  ctx.fillStyle = bull ? theme.bull : theme.bear;
  roundRect(ctx, tx, y - 9, tw, 18, 3);
  ctx.fillStyle = theme.bg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, tx + 5, y);
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  layout: ChartLayout,
  engine: EngineResult,
  theme: ChartTheme,
  interval: string,
) {
  ctx.fillStyle = theme.muted;
  ctx.font = "500 10px IBM Plex Sans, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const last = engine.candles[engine.candles.length - 1];
  const lastY = last ? yAt(layout, last.c) : -999;
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const price = layout.maxP - ((layout.maxP - layout.minP) / steps) * i;
    const y = layout.plotY + (layout.plotH / steps) * i;
    if (Math.abs(y - lastY) < 16) continue;
    ctx.fillText(formatPrice(price), layout.plotX + layout.plotW + 6, y);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const bars = layout.view.end - layout.view.start + 1;
  const xStep = Math.max(8, Math.round(bars / 6));
  for (let i = layout.view.start; i <= layout.view.end; i += xStep) {
    const c = engine.candles[i];
    if (!c) continue;
    ctx.fillText(formatTime(c.t, interval), xAt(layout, i), layout.height - layout.padB + 6);
  }
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  layout: ChartLayout,
  engine: EngineResult,
  theme: ChartTheme,
  ch: NonNullable<Crosshair>,
  interval: string,
) {
  const c = engine.candles[ch.index];
  if (!c) return;
  const x = xAt(layout, ch.index);
  const y = Math.min(layout.plotY + layout.plotH, Math.max(layout.plotY, ch.y));
  ctx.strokeStyle = withAlpha(theme.fg, 0.22);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, layout.plotY);
  ctx.lineTo(x, layout.plotY + layout.plotH);
  ctx.moveTo(layout.plotX, y);
  ctx.lineTo(layout.plotX + layout.plotW, y);
  ctx.stroke();
  ctx.setLineDash([]);

  const lastPivot = engine.lastPivot;
  const dt = lastPivot ? ch.index - lastPivot.index : 0;
  const dp = lastPivot ? Math.abs((c.c - lastPivot.price) / engine.priceUnit) : 0;
  const lines = [
    formatPrice(c.c),
    formatTime(c.t, interval),
    `O ${formatPrice(c.o)}  H ${formatPrice(c.h)}  L ${formatPrice(c.l)}`,
    lastPivot ? `Δt ${dt} bars   Δp ${dp.toFixed(1)} units` : "No pivot yet",
  ];
  if (engine.forming) {
    lines.push(`Square ${ (engine.forming.completion * 100).toFixed(0)}%  tgt ${formatPrice(engine.forming.targetPrice)}`);
  }
  ctx.font = "500 11px IBM Plex Sans, sans-serif";
  const pad = 8;
  const lh = 16;
  const boxW = 232;
  const boxH = pad * 2 + lines.length * lh;
  let bx = x + 12;
  let by = y + 12;
  if (bx + boxW > layout.plotX + layout.plotW) bx = x - boxW - 12;
  if (by + boxH > layout.plotY + layout.plotH) by = y - boxH - 12;
  ctx.fillStyle = withAlpha(theme.surface, 0.94);
  roundRect(ctx, bx, by, boxW, boxH, 8);
  ctx.strokeStyle = withAlpha(theme.fg, 0.12);
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, boxW, boxH);
  ctx.fillStyle = theme.fg;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? theme.fg : theme.muted;
    ctx.font = i === 0 ? "600 12px IBM Plex Sans, sans-serif" : "500 11px IBM Plex Sans, sans-serif";
    ctx.fillText(line, bx + pad, by + pad + i * lh);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}
