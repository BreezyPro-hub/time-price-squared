import type {
  Candle,
  Decision,
  GannAngle,
  Pivot,
  SquareOfNineLevel,
  TimeCycle,
  TimePriceSquare,
  TradeBias,
} from "./types.ts";
import { so9Proximity } from "./square-of-nine.ts";
import { priceOnAngle } from "./angles.ts";
import { upcomingCycles } from "./cycles.ts";
import { clamp } from "./math.ts";

export function makeDecision(input: {
  candles: Candle[];
  squares: TimePriceSquare[];
  cycles: TimeCycle[];
  so9: SquareOfNineLevel[];
  angles: GannAngle[];
  lastPivot: Pivot | null;
  atr: number;
}): Decision {
  const { candles, squares, cycles, so9, angles, lastPivot, atr } = input;
  if (candles.length < 8) {
    return idle("Not enough bars to square time and price.");
  }

  const last = candles[candles.length - 1];
  const lastIndex = candles.length - 1;
  const forming = squares.find((s) => s.status === "forming") ?? null;
  const recentComplete = squares
    .filter((s) => s.status === "complete" && lastIndex - s.endIndex <= 8)
    .sort((a, b) => b.endIndex - a.endIndex)[0];

  const nearCycles = upcomingCycles(cycles, lastIndex, 6);
  const stacked = nearCycles.filter((c) => c.confluence >= 1 || Math.abs(c.index - lastIndex) <= 1);
  const so9Hit = so9Proximity(last.c, so9, atr);
  const angleHit = priceOnAngle(last.c, angles, atr);

  let score = 0;
  const reasons: string[] = [];
  const confluence = {
    square: false,
    cycle: stacked.length > 0,
    so9: Boolean(so9Hit),
    angle: Boolean(angleHit),
  };

  const trend = structureBias(candles, lastPivot);

  if (forming && forming.completion >= 0.82 && forming.status === "forming") {
    confluence.square = true;
    score += forming.direction === "up" ? 2.4 : -2.4;
    reasons.push(
      `Forming ${forming.direction === "up" ? "advance" : "decline"} square is ${(forming.completion * 100).toFixed(0)}% complete — time and price are nearly balanced.`,
    );
  }

  if (recentComplete) {
    confluence.square = true;
    const dir = recentComplete.direction === "up" ? 1 : -1;
    score += dir * 1.6;
    reasons.push(
      `Time-price square completed ${lastIndex - recentComplete.endIndex === 0 ? "this bar" : `${lastIndex - recentComplete.endIndex} bars ago`} (${recentComplete.timeBars} bars × ${recentComplete.priceUnits.toFixed(1)} units, ${(recentComplete.efficiency * 100).toFixed(0)}% tight).`,
    );
  }

  if (stacked.length > 0) {
    const top = stacked[0];
    const bump = 1.4 + Math.min(2, top.confluence) * 0.7;
    score += trend * bump * 0.35 + (top.pivot.type === "low" ? bump : -bump) * 0.4;
    const names = [...new Set(stacked.map((c) => c.label))].slice(0, 3).join(" + ");
    reasons.push(
      `Time cycle ${names} from the ${top.pivot.type} at ${formatShort(top.pivot.price)} ${top.index === lastIndex ? "hits now" : `in ${top.index - lastIndex} bars`}${top.confluence > 0 ? ` — ${top.confluence + 1} cycles cluster` : ""}.`,
    );
  }

  if (so9Hit) {
    score += so9Hit.side === "support" ? 1.5 : -1.5;
    reasons.push(`Price is on Square of Nine ${so9Hit.degrees}° ${so9Hit.side} (${formatShort(so9Hit.price)}).`);
  }

  if (angleHit) {
    const holding =
      (angleHit.pivot.type === "low" && last.c >= angleHit.currentPrice * 0.998) ||
      (angleHit.pivot.type === "high" && last.c <= angleHit.currentPrice * 1.002);
    score += holding ? (angleHit.pivot.type === "low" ? 1.2 : -1.2) : 0;
    reasons.push(`Trading the ${angleHit.label} Gann angle from the last ${angleHit.pivot.type}.`);
  }

  score += trend * 0.8;
  if (Math.abs(trend) > 0.4) {
    reasons.push(trend > 0 ? "Swing structure is higher-highs / higher-lows." : "Swing structure is lower-highs / lower-lows.");
  }

  score = clamp(score, -10, 10);
  const bias = scoreToBias(score);

  if (reasons.length === 0) {
    reasons.push("No square, cycle, or Square of Nine confluence right now. Wait for time to catch price.");
  }

  const target = pickTarget(forming, so9, last.c, score);
  const invalidation = pickInvalidation(lastPivot, last, atr, score);
  const nextEvent = pickNextEvent(forming, nearCycles, lastIndex, candles);

  return {
    bias,
    score,
    headline: headlineFor(bias, confluence),
    reasons: reasons.slice(0, 4),
    invalidation,
    target,
    nextEvent,
    confluence,
  };
}

function idle(headline: string): Decision {
  return {
    bias: "wait",
    score: 0,
    headline,
    reasons: [],
    invalidation: 0,
    target: 0,
    nextEvent: null,
    confluence: { square: false, cycle: false, so9: false, angle: false },
  };
}

function structureBias(candles: Candle[], lastPivot: Pivot | null): number {
  if (candles.length < 20) return 0;
  const slice = candles.slice(-30);
  const first = slice[0].c;
  const last = slice[slice.length - 1].c;
  const drift = (last - first) / first;
  const pivotBias = lastPivot ? (lastPivot.type === "low" ? 0.25 : -0.25) : 0;
  return clamp(drift * 12 + pivotBias, -1, 1);
}

function scoreToBias(score: number): TradeBias {
  if (score >= 4.2) return "strong_long";
  if (score >= 1.6) return "long";
  if (score <= -4.2) return "strong_short";
  if (score <= -1.6) return "short";
  return "wait";
}

function headlineFor(bias: TradeBias, c: Decision["confluence"]): string {
  const hits = [c.square && "square", c.cycle && "cycle", c.so9 && "So9", c.angle && "angle"].filter(Boolean);
  const tag = hits.length ? hits.join(" · ") : "no confluence";
  switch (bias) {
    case "strong_long":
      return `Strong long — ${tag}`;
    case "long":
      return `Long bias — ${tag}`;
    case "strong_short":
      return `Strong short — ${tag}`;
    case "short":
      return `Short bias — ${tag}`;
    default:
      return `Stand aside — ${tag}`;
  }
}

function pickTarget(
  forming: TimePriceSquare | null,
  so9: SquareOfNineLevel[],
  price: number,
  score: number,
): number {
  if (forming && forming.status === "forming") return forming.targetPrice;
  const side = score >= 0 ? "resistance" : "support";
  const next = so9
    .filter((l) => (side === "resistance" ? l.price > price : l.price < price))
    .sort((a, b) => Math.abs(a.price - price) - Math.abs(b.price - price))[0];
  return next?.price ?? price;
}

function pickInvalidation(lastPivot: Pivot | null, last: Candle, atr: number, score: number): number {
  if (lastPivot) {
    if (score >= 0) return lastPivot.type === "low" ? lastPivot.price - atr * 0.25 : last.l - atr;
    return lastPivot.type === "high" ? lastPivot.price + atr * 0.25 : last.h + atr;
  }
  return score >= 0 ? last.l - atr : last.h + atr;
}

function pickNextEvent(
  forming: TimePriceSquare | null,
  near: TimeCycle[],
  lastIndex: number,
  candles: { t: number }[],
): Decision["nextEvent"] {
  const events: NonNullable<Decision["nextEvent"]>[] = [];
  if (forming && forming.status === "forming") {
    const bars = Math.max(0, forming.projectedIndex - lastIndex);
    events.push({
      bars,
      label: `Square completes (${forming.direction === "up" ? "up" : "down"})`,
      time: candles[Math.min(forming.endIndex, candles.length - 1)]?.t ?? Date.now(),
    });
  }
  for (const c of near) {
    events.push({
      bars: Math.max(0, c.index - lastIndex),
      label: `${c.label}-bar cycle`,
      time: c.time,
    });
  }
  events.sort((a, b) => a.bars - b.bars);
  return events[0] ?? null;
}

function formatShort(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}
