export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type Pivot = {
  index: number;
  time: number;
  price: number;
  type: "high" | "low";
  strength: number;
};

export type TimePriceSquare = {
  id: string;
  pivot: Pivot;
  startIndex: number;
  endIndex: number;
  projectedIndex: number;
  top: number;
  bottom: number;
  direction: "up" | "down";
  status: "forming" | "complete" | "broken";
  priceMove: number;
  timeBars: number;
  priceUnits: number;
  efficiency: number;
  completion: number;
  targetPrice: number;
};

export type TimeCycle = {
  id: string;
  pivot: Pivot;
  bars: number;
  index: number;
  time: number;
  label: string;
  family: "gann" | "fib" | "eighth";
  confluence: number;
  inView: boolean;
};

export type SquareOfNineLevel = {
  price: number;
  degrees: number;
  label: string;
  side: "support" | "resistance";
  distance: number;
};

export type GannAngle = {
  id: string;
  pivot: Pivot;
  rise: number;
  run: number;
  label: string;
  currentPrice: number;
};

export type TradeBias =
  | "strong_long"
  | "long"
  | "wait"
  | "short"
  | "strong_short";

export type Decision = {
  bias: TradeBias;
  score: number;
  headline: string;
  reasons: string[];
  invalidation: number;
  target: number;
  nextEvent: { bars: number; label: string; time: number } | null;
  confluence: {
    square: boolean;
    cycle: boolean;
    so9: boolean;
    angle: boolean;
  };
};

export type EngineResult = {
  candles: Candle[];
  pivots: Pivot[];
  squares: TimePriceSquare[];
  cycles: TimeCycle[];
  so9: SquareOfNineLevel[];
  angles: GannAngle[];
  decision: Decision;
  atr: number;
  priceUnit: number;
  lastPivot: Pivot | null;
  forming: TimePriceSquare | null;
};

export type EngineSettings = {
  pivotLeft: number;
  pivotRight: number;
  minPivotStrength: number;
  priceUnitMode: "atr" | "range" | "manual";
  priceUnitManual: number;
  atrMult: number;
  squareTolerance: number;
  maxSquares: number;
  cycleSet: number[];
  showEighths: boolean;
  so9Degrees: number[];
  angleSet: Array<[number, number]>;
};
