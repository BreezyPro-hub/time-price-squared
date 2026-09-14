import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-bg/70" onClick={onClose}>
      <div
        role="dialog"
        aria-labelledby="guide-title"
        className="guide-body w-full max-w-lg rounded-xl bg-surface shadow-[var(--shadow-border)] p-5 sm:p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">Method</p>
            <h2 id="guide-title" className="font-display text-2xl text-fg mt-1">
              Time squares price
            </h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
        <div className="space-y-4 text-sm text-muted leading-relaxed">
          <p>
            W.D. Gann treated time and price as the same quantity. When the distance price has traveled from a swing
            equals the number of bars it took — after scaling by a price unit — the market is <em className="text-fg">squared</em>. That is a decision bar, not a guarantee.
          </p>
          <ol className="list-decimal pl-4 space-y-2">
            <li>
              <span className="text-fg">Squares</span> — filled boxes from confirmed pivots. Green from lows, red from highs. A dashed box is still forming; the dotted edge is the target where time will catch price.
            </li>
            <li>
              <span className="text-fg">Time cycles</span> — verticals at 45, 90, 144, 180, 270, 360 bars from major swings. When two land on the same bar, the line brightens. That cluster is the trade window.
            </li>
            <li>
              <span className="text-fg">Square of Nine</span> — harmonic prices 45° apart on the wheel. A touch of 90° or 180° with a cycle is Gann’s classic reversal geometry.
            </li>
            <li>
              <span className="text-fg">Angles</span> — 1×1 is one price unit per bar, Gann’s balance line. Holding it from a low is trend; losing it is a warning.
            </li>
          </ol>
          <p>
            The decision rail scores those four together. Trade only when the score leaves “stand aside” and you have a square or cycle in play. Voice alerts speak the same call so you can watch price, not the panel.
          </p>
          <p className="text-xs text-subtle">
            Paste the Pine script from the TV tab onto any TradingView chart to run the same squares and cycles there.
          </p>
        </div>
      </div>
    </div>
  );
}
