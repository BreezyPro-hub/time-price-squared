import type { ReactNode } from "react";
import { Shield, Target, Timer } from "lucide-react";
import type { Decision, TradeBias } from "@/lib/gann/types";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const BIAS_COPY: Record<TradeBias, { label: string; tone: "bull" | "bear" | "wait"; verb: string }> = {
  strong_long: { label: "Strong long", tone: "bull", verb: "Look to buy dips into support of the square." },
  long: { label: "Long", tone: "bull", verb: "Bias is up. Wait for a cycle or 1×1 hold to enter." },
  wait: { label: "Stand aside", tone: "wait", verb: "Time and price are not squared. Do not force a trade." },
  short: { label: "Short", tone: "bear", verb: "Bias is down. Sell rips into resistance of the square." },
  strong_short: { label: "Strong short", tone: "bear", verb: "Look to sell rallies into the completing square." },
};

export function DecisionPanel({ decision, priceUnit, atr }: { decision: Decision; priceUnit: number; atr: number }) {
  const copy = BIAS_COPY[decision.bias];
  const mag = Math.min(100, Math.abs(decision.score) * 10);

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Decision</p>
          <h2 className="font-display text-2xl leading-tight text-fg mt-1">{copy.label}</h2>
        </div>
        <Badge tone={copy.tone}>
          {decision.score >= 0 ? "+" : ""}
          {decision.score.toFixed(1)}
        </Badge>
      </header>

      <div className="h-1.5 rounded-full bg-raised overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200",
            copy.tone === "bear" ? "bg-bear" : copy.tone === "bull" ? "bg-bull" : "bg-muted",
          )}
          style={{ width: `${Math.max(8, mag)}%` }}
        />
      </div>

      <p className="text-sm text-muted leading-relaxed">{copy.verb}</p>
      <p className="text-sm text-fg">{decision.headline}</p>

      <ul className="space-y-2">
        {decision.reasons.map((r) => (
          <li key={r} className="text-sm text-muted leading-snug pl-3 border-l border-border-strong">
            {r}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-3 gap-2 pt-1">
        <Stat icon={<Target className="size-3.5" />} label="Target" value={decision.target ? formatPrice(decision.target) : "—"} />
        <Stat icon={<Shield className="size-3.5" />} label="Invalid" value={decision.invalidation ? formatPrice(decision.invalidation) : "—"} />
        <Stat
          icon={<Timer className="size-3.5" />}
          label="Next"
          value={
            decision.nextEvent
              ? decision.nextEvent.bars === 0
                ? "Now"
                : `${decision.nextEvent.bars} bars`
              : "—"
          }
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Flag on={decision.confluence.square} label="Square" />
        <Flag on={decision.confluence.cycle} label="Cycle" />
        <Flag on={decision.confluence.so9} label="So9" />
        <Flag on={decision.confluence.angle} label="Angle" />
      </div>

      <p className="text-xs text-subtle">
        Scale · 1 bar = {formatPrice(priceUnit)} · ATR {formatPrice(atr)}
      </p>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-raised px-2 py-2">
      <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-subtle">
        {icon}
        {label}
      </p>
      <p className="tabular text-sm text-fg mt-1 truncate">{value}</p>
    </div>
  );
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return <Badge tone={on ? "accent" : "neutral"}>{label}</Badge>;
}
