import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { so9FromRoot, priceToWheelAngle } from "./square-of-nine.ts";
import { detectPivots, wilderAtr } from "./math.ts";
import { findTimePriceSquares } from "./squares.ts";
import { runEngine } from "./engine.ts";
import type { Candle } from "./types.ts";

function candle(i: number, price: number, t0 = 1_700_000_000_000): Candle {
  return { t: t0 + i * 3_600_000, o: price, h: price, l: price, c: price, v: 1000 };
}

describe("square of nine", () => {
  it("360° is a full root increment of 2", () => {
    const p = 100;
    const up = so9FromRoot(p, 360, 1);
    const expected = (Math.sqrt(p) + 2) ** 2;
    assert.ok(Math.abs(up - expected) < 1e-9);
  });

  it("maps perfect squares onto the cardinal cross", () => {
    assert.equal(Math.round(priceToWheelAngle(64)), 0);
    assert.equal(Math.round(priceToWheelAngle(81)), 180);
  });
});

describe("pivots and squares", () => {
  it("detects a clear low then high", () => {
    const candles: Candle[] = [];
    const prices = [
      10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 10, 9, 8, 7,
    ];
    for (let i = 0; i < prices.length; i++) candles.push(candle(i, 100 + prices[i]));
    const pivots = detectPivots(candles, 3, 3);
    assert.ok(pivots.some((p) => p.type === "low"));
    assert.ok(pivots.some((p) => p.type === "high"));
  });

  it("squares when price units equal bars", () => {
    const unit = 1;
    const candles: Candle[] = [];
    for (let i = 0; i < 30; i++) {
      const p = 50 + i * unit;
      candles.push(candle(i, p));
    }
    candles[0] = { ...candles[0], l: 50, h: 50.2, c: 50, o: 50 };
    const pivots = [{ index: 0, time: candles[0].t, price: 50, type: "low" as const, strength: 8 }];
    const squares = findTimePriceSquares(candles, pivots, unit, 0.15, 8);
    assert.ok(squares.some((s) => s.status === "complete" || s.status === "forming"));
  });
});

describe("engine", () => {
  it("returns a decision on a trending series", () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 180; i++) {
      const wave = Math.sin(i / 18) * 4;
      const trend = i * 0.12;
      candles.push(candle(i, 100 + trend + wave));
    }
    const result = runEngine(candles);
    assert.ok(result.atr > 0);
    assert.ok(result.decision.headline.length > 0);
    assert.ok(Array.isArray(result.squares));
    assert.ok(wilderAtr(candles) > 0);
  });
});
