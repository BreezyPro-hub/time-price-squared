import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PINE_SCRIPT } from "@/lib/pine";

export function PinePanel() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PINE_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">TradingView</p>
          <h2 className="text-sm font-medium text-fg mt-1">Pine v5 indicator</h2>
        </div>
        <Button variant="secondary" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy script"}
        </Button>
      </header>
      <p className="text-sm text-muted leading-relaxed">
        Pine Editor → paste → Add to chart. Squares, cycle verticals, Square of Nine, and 1×1 angles match this desk.
      </p>
      <pre className="max-h-56 overflow-auto rounded-md bg-raised p-3 text-xs leading-relaxed text-muted whitespace-pre-wrap">
        {PINE_SCRIPT.slice(0, 900)}…
      </pre>
    </section>
  );
}
