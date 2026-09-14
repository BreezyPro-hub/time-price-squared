import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  label,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-3 min-h-11 cursor-pointer">
      {label ? <span className="text-sm text-fg">{label}</span> : null}
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150",
          checked ? "bg-accent" : "bg-raised shadow-[var(--shadow-border)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full transition-transform duration-150",
            checked ? "translate-x-4 bg-accent-fg" : "translate-x-0 bg-muted",
          )}
        />
      </button>
    </label>
  );
}
