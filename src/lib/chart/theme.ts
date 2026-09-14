export type ChartTheme = {
  bg: string;
  fg: string;
  muted: string;
  grid: string;
  bull: string;
  bear: string;
  cycle: string;
  accent: string;
  surface: string;
};

export function readChartTheme(el: HTMLElement): ChartTheme {
  const s = getComputedStyle(el);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    bg: v("--color-bg", "#090a0c"),
    fg: v("--color-fg", "#eceef2"),
    muted: v("--color-muted", "#8b919c"),
    grid: v("--color-chart-grid", "rgba(236,238,242,0.07)"),
    bull: v("--color-bull", "#4ead7a"),
    bear: v("--color-bear", "#c45c5c"),
    cycle: v("--color-cycle", "#9aa3b2"),
    accent: v("--color-accent", "#c8ccd4"),
    surface: v("--color-surface", "#12141a"),
  };
}

export function withAlpha(color: string, alpha: number): string {
  const t = color.trim();
  if (t.startsWith("#") && t.length === 7) {
    const r = parseInt(t.slice(1, 3), 16);
    const g = parseInt(t.slice(3, 5), 16);
    const b = parseInt(t.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (t.startsWith("rgb(")) return t.replace("rgb(", "rgba(").replace(")", `,${alpha})`);
  return t;
}
