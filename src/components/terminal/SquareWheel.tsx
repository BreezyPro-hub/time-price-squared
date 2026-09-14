import { priceToWheelAngle } from "@/lib/gann/square-of-nine";
import { formatPrice } from "@/lib/utils";

export function SquareWheel({ price, levels }: { price: number; levels: { price: number; degrees: number; side: string; distance?: number }[] }) {
  const angle = priceToWheelAngle(price);
  const size = 196;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const nearest = [...levels].sort((a, b) => (a.distance ?? 1) - (b.distance ?? 1))[0];

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-52" aria-label="Square of Nine wheel">
        <rect width={size} height={size} fill="transparent" />
        {[1, 0.72, 0.44].map((f) => (
          <rect
            key={f}
            x={cx - r * f}
            y={cy - r * f}
            width={r * 2 * f}
            height={r * 2 * f}
            fill="none"
            stroke="currentColor"
            className="text-border-strong"
            strokeWidth={1}
            transform={`rotate(0 ${cx} ${cy})`}
          />
        ))}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
          const rad = ((d - 90) * Math.PI) / 180;
          const x2 = cx + Math.cos(rad) * r;
          const y2 = cy + Math.sin(rad) * r;
          const strong = d % 90 === 0;
          return (
            <g key={d}>
              <line
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                className={strong ? "text-fg/40" : "text-border-strong"}
                strokeWidth={strong ? 1.2 : 0.8}
              />
              <text
                x={cx + Math.cos(rad) * (r + 16)}
                y={cy + Math.sin(rad) * (r + 16)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted"
                fontSize="9"
                fontFamily="IBM Plex Sans, sans-serif"
              >
                {d}°
              </text>
            </g>
          );
        })}
        <circle
          cx={cx + Math.cos(((angle - 90) * Math.PI) / 180) * (r * 0.72)}
          cy={cy + Math.sin(((angle - 90) * Math.PI) / 180) * (r * 0.72)}
          r={5}
          className="fill-accent"
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-fg"
          fontSize="11"
          fontFamily="IBM Plex Sans, sans-serif"
          fontWeight={600}
        >
          {angle.toFixed(0)}°
        </text>
      </svg>
      <p className="text-xs text-muted text-center">
        Price sits at {angle.toFixed(0)}° on the wheel
        {nearest ? ` · nearest ${nearest.degrees}° at ${formatPrice(nearest.price)}` : ""}
      </p>
    </div>
  );
}
