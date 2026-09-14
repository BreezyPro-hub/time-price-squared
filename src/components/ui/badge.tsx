import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "bull" | "bear" | "wait" | "accent";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-raised text-muted",
    bull: "bg-bull/15 text-bull",
    bear: "bg-bear/15 text-bear",
    wait: "bg-raised text-muted",
    accent: "bg-accent text-accent-fg",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
