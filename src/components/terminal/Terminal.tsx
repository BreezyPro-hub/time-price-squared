import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleHelp, Volume2, VolumeX } from "lucide-react";
import { GannChart } from "@/components/chart/GannChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DecisionPanel } from "./DecisionPanel";
import { GuideSheet } from "./GuideSheet";
import { PinePanel } from "./PinePanel";
import { SettingsPanel } from "./SettingsPanel";
import { SquareWheel } from "./SquareWheel";
import { runEngine } from "@/lib/gann/engine";
import { DEFAULT_SETTINGS } from "@/lib/gann/math";
import type { EngineSettings } from "@/lib/gann/types";
import type { OverlayFlags } from "@/lib/chart/draw";
import type { View } from "@/lib/chart/layout";
import { getKlines } from "@/lib/market/klines";
import { generateSynthetic } from "@/lib/market/synthetic";
import { INTERVALS, SYMBOLS, type Interval } from "@/lib/market/symbols";
import { decisionSpeech, speechDesk, squareSpeech } from "@/lib/tts";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const OVERLAYS_DEFAULT: OverlayFlags = {
  squares: true,
  cycles: true,
  so9: true,
  angles: true,
  pivots: true,
};

type SideTab = "decision" | "wheel" | "pine" | "settings";

export function Terminal() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState<Interval>("1h");
  const [candles, setCandles] = useState(() => generateSynthetic("BTCUSDT", "1h"));
  const [source, setSource] = useState<"binance" | "yahoo" | "fyers" | "synthetic">("synthetic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<EngineSettings>(DEFAULT_SETTINGS);
  const [overlays, setOverlays] = useState<OverlayFlags>(OVERLAYS_DEFAULT);
  const [view, setView] = useState<View>({ start: 0, end: 160 });
  const [voice, setVoice] = useState(false);
  const [guide, setGuide] = useState(false);
  const [tab, setTab] = useState<SideTab>("decision");

  const load = useCallback(async (sym: string, tf: Interval) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getKlines({ data: { symbol: sym, interval: tf } });
      setCandles(res.candles);
      setSource(res.source);
      const end = res.candles.length - 1;
      setView({ start: Math.max(0, end - 160), end });
    } catch {
      const fallback = generateSynthetic(sym, tf);
      setCandles(fallback);
      setSource("synthetic");
      setError("Live feed unavailable — showing a squared demo series.");
      const end = fallback.length - 1;
      setView({ start: Math.max(0, end - 160), end });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(symbol, interval);
  }, [symbol, interval, load]);

  const engine = useMemo(() => runEngine(candles, settings), [candles, settings]);
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const chg = last && prev ? last.c - prev.c : 0;
  const chgPct = last && prev ? (chg / prev.c) * 100 : 0;

  useEffect(() => {
    speechDesk.enabled = voice;
    if (!voice) {
      speechDesk.stop();
      return;
    }
    const sq = engine.forming;
    const spokenSquare = sq ? squareSpeech(sq) : "";
    if (spokenSquare && sq && (sq.status === "complete" || sq.completion >= 0.85)) {
      speechDesk.speak(spokenSquare, `sq-${sq.id}-${sq.status}-${sq.completion.toFixed(1)}`);
      return;
    }
    speechDesk.speak(decisionSpeech(engine.decision, symbol), `dec-${symbol}-${engine.decision.bias}-${engine.decision.headline}`);
  }, [voice, engine.decision, engine.forming, symbol]);

  const toggleVoice = () => {
    if (!voice) {
      speechDesk.unlock();
      speechDesk.enabled = true;
      setVoice(true);
    } else {
      speechDesk.enabled = false;
      speechDesk.stop();
      setVoice(false);
    }
  };

  const symbolLabel = SYMBOLS.find((s) => s.id === symbol)?.label ?? symbol;

  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col">
      <header className="shrink-0 border-b border-border px-3 sm:px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted">TTS Square</p>
            <h1 className="font-display text-xl sm:text-2xl leading-tight truncate">Time · Price · Square</h1>
          </div>
          <Button variant={voice ? "default" : "secondary"} size="sm" onClick={toggleVoice} aria-pressed={voice}>
            {voice ? <Volume2 /> : <VolumeX />}
            <span className="hidden sm:inline">{voice ? "Voice on" : "Voice"}</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setGuide(true)} aria-label="How it works">
            <CircleHelp />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="symbol">
            Market
          </label>
          <select
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="h-11 min-w-36 rounded-md bg-raised px-3 text-sm text-fg shadow-[var(--shadow-border)]"
          >
            {SYMBOLS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-md bg-raised p-1 shadow-[var(--shadow-border)]">
            {INTERVALS.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setInterval(tf.id)}
                className={cn(
                  "h-9 min-w-11 px-2.5 rounded-sm text-xs font-medium",
                  interval === tf.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>
          {last ? (
            <div className="ml-auto flex items-baseline gap-2 tabular">
              <span className="text-lg font-medium">{formatPrice(last.c)}</span>
              <span className={cn("text-sm", chg >= 0 ? "text-bull" : "text-bear")}>
                {chg >= 0 ? "+" : ""}
                {chgPct.toFixed(2)}%
              </span>
            </div>
          ) : null}
        </div>
      </header>

      <div className="flex-1 terminal-grid min-h-0">
        <div className="chart-stage">
          {loading ? (
            <div className="absolute inset-0 z-10 bg-bg/50 flex items-center justify-center text-sm text-muted">
              Squaring {symbolLabel}…
            </div>
          ) : null}
          <GannChart engine={engine} interval={interval} view={view} onViewChange={setView} overlays={overlays} />
          <div className="absolute left-3 bottom-10 flex flex-wrap gap-1.5 pointer-events-none">
            <Badge tone={source === "synthetic" ? "wait" : "neutral"}>{source === "synthetic" ? "Demo series" : source === "fyers" ? "Fyers Live" : "Live"}</Badge>
            {engine.forming ? (
              <Badge tone="accent">Square {(engine.forming.completion * 100).toFixed(0)}%</Badge>
            ) : null}
            {engine.decision.nextEvent ? (
              <Badge tone="neutral">{engine.decision.nextEvent.label}</Badge>
            ) : null}
          </div>
        </div>

        <aside className="side-rail p-3 sm:p-4 space-y-3 overflow-y-auto">
          <div className="flex rounded-md bg-raised p-1 shadow-[var(--shadow-border)]">
            {(
              [
                ["decision", "Call"],
                ["wheel", "So9"],
                ["pine", "TV"],
                ["settings", "Setup"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex-1 h-9 rounded-sm text-xs font-medium",
                  tab === id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "decision" ? (
            <DecisionPanel decision={engine.decision} priceUnit={engine.priceUnit} atr={engine.atr} />
          ) : null}
          {tab === "wheel" ? (
            <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs uppercase tracking-widest text-muted mb-3">Square of Nine</p>
              <SquareWheel price={last?.c ?? 0} levels={engine.so9} />
              <ul className="mt-4 space-y-1.5">
                {engine.so9.slice(0, 6).map((l) => (
                  <li key={`${l.price}-${l.degrees}`} className="flex justify-between text-sm">
                    <span className="text-muted">{l.label}</span>
                    <span className="tabular text-fg">{formatPrice(l.price)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {tab === "pine" ? <PinePanel /> : null}
          {tab === "settings" ? (
            <SettingsPanel settings={settings} onChange={setSettings} overlays={overlays} onOverlays={setOverlays} />
          ) : null}
          {error ? <p className="text-xs text-warn px-1">{error}</p> : null}
        </aside>
      </div>

      <footer className="hidden sm:flex items-center gap-4 px-5 py-2 border-t border-border text-xs text-subtle">
        <span>Drag to pan · wheel to zoom</span>
        <span>Squares = time units vs price units</span>
        <span className="ml-auto">Not financial advice</span>
      </footer>
      <GuideSheet open={guide} onClose={() => setGuide(false)} />
    </div>
  );
}
