"use client";

// Small dependency-free charts (plain divs / SVG) so no extra npm package is needed.

export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div
        className={`h-2 rounded-full ${p === 100 ? "bg-[#10B981]" : "bg-[#3B82F6]"}`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="text-sm text-slate-500">No data yet.</p>;
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span className="truncate text-slate-600">{d.label}</span>
            <span className="font-medium text-slate-900">{d.value}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-2.5 rounded-full bg-[#3B82F6]"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({
  data,
  centerLabel,
}: {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-32 w-32 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E2E8F0" strokeWidth="14" />
        {total > 0 &&
          data.map((d) => {
            const len = (d.value / total) * c;
            const el = (
              <circle
                key={d.label}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth="14"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 fill-slate-900 text-[16px] font-bold"
          style={{ transformOrigin: "50% 50%" }}
        >
          {total}
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="font-medium text-slate-900">{d.value}</span>
          </li>
        ))}
        {centerLabel && <li className="pt-1 text-xs text-slate-400">{centerLabel}</li>}
      </ul>
    </div>
  );
}
