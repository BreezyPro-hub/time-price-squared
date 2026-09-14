import type { SquareOfNineLevel } from "./types.ts";

/** 360° on the Square of Nine = increment of 2.0 on the square root. */
export function so9FromRoot(rootPrice: number, degrees: number, dir: 1 | -1): number {
  const sqrt = Math.sqrt(Math.max(rootPrice, 0));
  const increment = degrees / 180;
  const next = sqrt + dir * increment;
  return next * next;
}

export function priceToWheelAngle(price: number): number {
  const sqrt = Math.sqrt(Math.max(price, 0));
  return ((sqrt % 2) * 180 + 360) % 360;
}

export function nearestHarmonic(price: number, degrees: number[]): number {
  const angle = priceToWheelAngle(price);
  let best = degrees[0] ?? 0;
  let bestDist = 360;
  for (const d of degrees) {
    const dist = Math.min(Math.abs(angle - d), 360 - Math.abs(angle - d));
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

export function squareOfNineLevels(
  lastPrice: number,
  pivotPrice: number,
  degrees: number[],
): SquareOfNineLevel[] {
  const levels: SquareOfNineLevel[] = [];
  const seen = new Set<string>();

  const push = (price: number, deg: number) => {
    if (!Number.isFinite(price) || price <= 0) return;
    const key = price.toFixed(6);
    if (seen.has(key)) return;
    seen.add(key);
    const side = price >= lastPrice ? "resistance" : "support";
    levels.push({
      price,
      degrees: deg,
      label: `${deg}° ${side === "resistance" ? "R" : "S"}`,
      side,
      distance: Math.abs(price - lastPrice) / lastPrice,
    });
  };

  const last = Math.max(lastPrice, 0);
  const root = Math.max(pivotPrice, last, 0);
  if (!Number.isFinite(last) || last <= 0) return [];

  for (const deg of degrees) {
    push(so9FromRoot(root, deg, 1), deg);
    push(so9FromRoot(root, deg, -1), deg);
    push(so9FromRoot(last, deg, 1), deg);
    push(so9FromRoot(last, deg, -1), deg);
  }

  levels.sort((a, b) => a.distance - b.distance);
  const nearby = levels.filter((l) => l.distance > 0 && l.distance < 0.12);
  const picked = (nearby.length >= 4 ? nearby : levels.filter((l) => l.distance < 0.35)).slice(0, 12);
  return picked.sort((a, b) => a.price - b.price);
}

export function so9Proximity(price: number, levels: SquareOfNineLevel[], atr: number): SquareOfNineLevel | null {
  if (levels.length === 0) return null;
  const tol = Math.max(atr * 0.35, price * 0.0015);
  let best: SquareOfNineLevel | null = null;
  let bestDist = Infinity;
  for (const l of levels) {
    const d = Math.abs(l.price - price);
    if (d < bestDist) {
      bestDist = d;
      best = l;
    }
  }
  if (!best || bestDist > tol) return null;
  return best;
}
