import type { ChartBar } from "@/lib/dashboard/types";

interface BarChartProps {
  bars: ChartBar[];
  emptyMessage?: string;
}

function fmtK(v: number): string {
  if (v === 0) return "$0";
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

export function BarChart({ bars, emptyMessage = "No data" }: BarChartProps) {
  const hasData = bars.some((b) => b.value > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="w-full" aria-label="Bar chart">
      <div className="flex items-end gap-1.5 h-28">
        {bars.map((bar, i) => {
          const pct = bar.value > 0 ? (bar.value / max) * 100 : 0;
          const isEmpty = bar.value === 0;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-0.5"
              title={`${bar.label}: ${fmtK(bar.value)}`}
            >
              {/* Value label */}
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">
                {bar.value > 0 ? fmtK(bar.value) : ""}
              </span>
              {/* Bar */}
              <div className="w-full flex items-end" style={{ height: "80px" }}>
                <div
                  className={`w-full rounded-t transition-all ${
                    isEmpty ? "bg-gray-200 dark:bg-giuseppe-border" : "bg-brand-600"
                  }`}
                  style={{ height: isEmpty ? "4px" : `${Math.max(pct, 3)}%` }}
                />
              </div>
              {/* Label */}
              <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium leading-none">
                {bar.label}
              </span>
              {bar.sublabel && (
                <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none">
                  {bar.sublabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
