import { buildGannAngles } from "./angles.ts";
import { buildTimeCycles } from "./cycles.ts";
import { makeDecision } from "./decision.ts";
import { DEFAULT_SETTINGS, detectPivots, majorPivots, resolvePriceUnit } from "./math.ts";
import { squareOfNineLevels } from "./square-of-nine.ts";
import { findTimePriceSquares } from "./squares.ts";
import type { Candle, EngineResult, EngineSettings } from "./types.ts";

export function runEngine(candles: Candle[], partial?: Partial<EngineSettings>): EngineResult {
  const settings: EngineSettings = { ...DEFAULT_SETTINGS, ...partial };
  if (candles.length < 10) {
    return emptyResult(candles);
  }

  const rawPivots = detectPivots(candles, settings.pivotLeft, settings.pivotRight);
  const pivots = majorPivots(rawPivots, candles, 14);
  const { atr, priceUnit } = resolvePriceUnit(candles, pivots, settings);
  const squares = findTimePriceSquares(
    candles,
    pivots,
    priceUnit,
    settings.squareTolerance,
    settings.maxSquares,
  );
  const lastPivot = pivots[pivots.length - 1] ?? null;
  const cycles = buildTimeCycles(candles, pivots, settings.cycleSet, settings.showEighths);
  const last = candles[candles.length - 1];
  const so9 = squareOfNineLevels(last.c, lastPivot?.price ?? last.c, settings.so9Degrees);
  const angles = buildGannAngles(candles, lastPivot, priceUnit, settings.angleSet);
  const forming = squares.find((s) => s.status === "forming") ?? null;
  const decision = makeDecision({ candles, squares, cycles, so9, angles, lastPivot, atr });

  return {
    candles,
    pivots,
    squares,
    cycles,
    so9,
    angles,
    decision,
    atr,
    priceUnit,
    lastPivot,
    forming,
  };
}

function emptyResult(candles: Candle[]): EngineResult {
  return {
    candles,
    pivots: [],
    squares: [],
    cycles: [],
    so9: [],
    angles: [],
    decision: {
      bias: "wait",
      score: 0,
      headline: "Load a market to square time and price.",
      reasons: [],
      invalidation: 0,
      target: 0,
      nextEvent: null,
      confluence: { square: false, cycle: false, so9: false, angle: false },
    },
    atr: 0,
    priceUnit: 1,
    lastPivot: null,
    forming: null,
  };
}

export { DEFAULT_SETTINGS };
