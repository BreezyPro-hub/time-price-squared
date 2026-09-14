import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number, digits?: number): string {
  const abs = Math.abs(value);
  const d =
    digits ??
    (abs >= 1000 ? 2 : abs >= 100 ? 2 : abs >= 10 ? 3 : abs >= 1 ? 4 : 5);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${(value / 1_000).toFixed(2)}K`;
  return formatPrice(value);
}

export function formatTime(ts: number, interval: string): string {
  const d = new Date(ts);
  if (interval === "1d" || interval === "1w") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
  }
  if (interval === "4h" || interval === "1h") {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
