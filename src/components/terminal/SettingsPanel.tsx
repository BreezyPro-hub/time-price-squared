import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { OverlayFlags } from "@/lib/chart/draw";
import type { EngineSettings } from "@/lib/gann/types";

export function SettingsPanel({
  settings,
  onChange,
  overlays,
  onOverlays,
}: {
  settings: EngineSettings;
  onChange: (s: EngineSettings) => void;
  overlays: OverlayFlags;
  onOverlays: (o: OverlayFlags) => void;
}) {
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted">Overlays</p>
        <div className="mt-2 space-y-1">
          <Switch checked={overlays.squares} onCheckedChange={(v) => onOverlays({ ...overlays, squares: v })} label="Time-price squares" />
          <Switch checked={overlays.cycles} onCheckedChange={(v) => onOverlays({ ...overlays, cycles: v })} label="Time cycles" />
          <Switch checked={overlays.so9} onCheckedChange={(v) => onOverlays({ ...overlays, so9: v })} label="Square of Nine" />
          <Switch checked={overlays.angles} onCheckedChange={(v) => onOverlays({ ...overlays, angles: v })} label="Gann angles" />
          <Switch checked={overlays.pivots} onCheckedChange={(v) => onOverlays({ ...overlays, pivots: v })} label="Pivot dots" />
        </div>
      </div>
      <Slider
        label="Pivot sensitivity"
        min={3}
        max={12}
        value={settings.pivotLeft}
        onChange={(v) => onChange({ ...settings, pivotLeft: v, pivotRight: v })}
      />
      <Slider
        label="Price unit (ATR ×)"
        min={0.2}
        max={1.5}
        step={0.05}
        value={settings.atrMult}
        onChange={(v) => onChange({ ...settings, atrMult: v })}
        format={(v) => v.toFixed(2)}
      />
      <Slider
        label="Square tightness"
        min={0.05}
        max={0.28}
        step={0.01}
        value={settings.squareTolerance}
        onChange={(v) => onChange({ ...settings, squareTolerance: v })}
        format={(v) => `${Math.round((1 - v) * 100)}%`}
      />
    </section>
  );
}
