import { useEffect, useRef } from "react";
import type { EngineResult } from "@/lib/gann/types";
import { drawChart, type Crosshair, type OverlayFlags } from "@/lib/chart/draw";
import { indexAt, makeLayout, type View } from "@/lib/chart/layout";
import { readChartTheme } from "@/lib/chart/theme";

export function GannChart({
  engine,
  interval,
  view,
  onViewChange,
  overlays,
}: {
  engine: EngineResult;
  interval: string;
  view: View;
  onViewChange: (v: View) => void;
  overlays: OverlayFlags;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crossRef = useRef<Crosshair>(null);
  const dragRef = useRef<{ x: number; start: number; end: number } | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const engineRef = useRef(engine);
  engineRef.current = engine;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const paint = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const extra = [
        ...engineRef.current.so9.map((l) => l.price),
        ...engineRef.current.squares.flatMap((s) => [s.top, s.bottom, s.targetPrice]),
        engineRef.current.lastPivot?.price ?? NaN,
      ];
      const layout = makeLayout(width, height, engineRef.current.candles, viewRef.current, extra);
      drawChart(
        ctx,
        layout,
        engineRef.current,
        readChartTheme(wrap),
        overlays,
        crossRef.current,
        interval,
        dpr,
      );
    };

    const ro = new ResizeObserver(() => paint());
    ro.observe(wrap);
    paint();

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const extra = engineRef.current.so9.map((l) => l.price);
      const layout = makeLayout(rect.width, rect.height, engineRef.current.candles, viewRef.current, extra);
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.x;
        const shift = Math.round(-dx / layout.barW);
        const span = dragRef.current.end - dragRef.current.start;
        const max = engineRef.current.candles.length - 1;
        let start = dragRef.current.start + shift;
        start = Math.max(0, Math.min(max - span, start));
        onViewChange({ start, end: start + span });
      }
      crossRef.current = { x, y, index: indexAt(layout, x) };
      paint();
    };

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      dragRef.current = { x: e.clientX, start: viewRef.current.start, end: viewRef.current.end };
    };
    const onUp = () => {
      dragRef.current = null;
    };
    const onLeave = () => {
      crossRef.current = null;
      paint();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const candles = engineRef.current.candles;
      if (candles.length < 10) return;
      const rect = canvas.getBoundingClientRect();
      const extra = engineRef.current.so9.map((l) => l.price);
      const layout = makeLayout(rect.width, rect.height, candles, viewRef.current, extra);
      const anchor = indexAt(layout, e.clientX - rect.left);
      const span = viewRef.current.end - viewRef.current.start;
      const zoom = e.deltaY > 0 ? 1.18 : 0.85;
      let next = Math.round(span * zoom);
      next = Math.max(40, Math.min(candles.length - 1, next));
      const ratio = (anchor - viewRef.current.start) / Math.max(1, span);
      let start = Math.round(anchor - next * ratio);
      start = Math.max(0, Math.min(candles.length - 1 - next, start));
      onViewChange({ start, end: start + next });
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [engine, interval, view, overlays, onViewChange]);

  return (
    <div ref={wrapRef} className="relative h-full w-full min-h-80 bg-bg">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}
