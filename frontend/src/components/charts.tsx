"use client";

/**
 * Lightweight, dependency-free SVG charts for the admin analytics section.
 * Kept intentionally simple (no charting library) to avoid React 19 / Next
 * peer-dependency issues and keep the bundle small.
 */

export interface ChartPoint {
  label: string;
  value: number;
}

const PALETTE = [
  "#059669", // emerald-600
  "#f97316", // orange-500
  "#3b82f6", // blue-500
  "#a855f7", // purple-500
  "#eab308", // yellow-500
  "#ef4444", // red-500
  "#14b8a6", // teal-500
  "#ec4899", // pink-500
];

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const largeArc = end - start <= 180 ? "0" : "1";
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
}

export function DonutChart({ data }: { data: ChartPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <p className="py-8 text-center text-sm text-zinc-400">No data yet</p>;
  }

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 62;
  const stroke = 22;

  let cursor = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d, i) => {
      const start = (cursor / total) * 360;
      cursor += d.value;
      const end = (cursor / total) * 360;
      return {
        path: arcPath(cx, cy, r, start, end),
        color: PALETTE[i % PALETTE.length],
        label: d.label,
        value: d.value,
        pct: Math.round((d.value / total) * 100),
      };
    });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-zinc-900 text-xl font-bold">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-zinc-400 text-[10px] uppercase">
          total
        </text>
      </svg>

      <ul className="flex flex-1 flex-col gap-1.5">
        {segments.map((seg, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="flex-1 text-zinc-600">{seg.label}</span>
            <span className="font-medium text-zinc-900">
              {seg.value} <span className="text-xs text-zinc-400">({seg.pct}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarChart({
  data,
  color = "#059669",
  valuePrefix = "",
}: {
  data: ChartPoint[];
  color?: string;
  valuePrefix?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 160;

  if (data.every((d) => d.value === 0)) {
    return <p className="py-8 text-center text-sm text-zinc-400">No data in this period yet</p>;
  }

  return (
    <div className="flex items-end gap-1 overflow-x-auto pb-1" style={{ height: chartHeight + 40 }}>
      {data.map((d, i) => {
        const h = d.value > 0 ? Math.max((d.value / max) * chartHeight, 2) : 0;
        return (
          <div key={i} className="group flex min-w-[24px] flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-zinc-500 opacity-0 transition group-hover:opacity-100">
              {valuePrefix}
              {d.value % 1 === 0 ? d.value : d.value.toFixed(0)}
            </span>
            <div
              className="w-full rounded-t transition-all"
              style={{ height: h, backgroundColor: color, minHeight: d.value > 0 ? 2 : 0 }}
              title={`${d.label}: ${valuePrefix}${d.value}`}
            />
            <span className="w-full truncate text-center text-[9px] text-zinc-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function UtilizationBar({ offered, booked }: { offered: number; booked: number }) {
  const pct = offered > 0 ? Math.min(Math.round((booked / offered) * 100), 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-zinc-900">{pct}%</span>
        <span className="text-sm text-zinc-500">
          {booked} of {offered} seats booked
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
