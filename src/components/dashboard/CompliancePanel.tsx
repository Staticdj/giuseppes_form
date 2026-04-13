import type { ComplianceData } from "@/lib/dashboard/types";

interface Props {
  data: ComplianceData;
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const todayStatusConfig = {
  missing: { label: "Missing", color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400", icon: "✗" },
  draft: { label: "Draft", color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400", icon: "~" },
  finalized: { label: "Finalised", color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400", icon: "✓" },
};

export function CompliancePanel({ data }: Props) {
  const todayCfg = todayStatusConfig[data.todayStatus];
  const weekPct =
    data.thisWeekDaysElapsed > 0
      ? Math.round((data.thisWeekFinalized / data.thisWeekDaysElapsed) * 100)
      : 0;

  return (
    <div className="bg-white dark:bg-giuseppe-card rounded-xl border border-gray-200 dark:border-giuseppe-border overflow-hidden mb-4">
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-giuseppe-darker border-b border-gray-200 dark:border-giuseppe-border">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Report Compliance
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Today */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Today&apos;s report</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${todayCfg.color}`}>
            {todayCfg.icon} {todayCfg.label}
          </span>
        </div>

        {/* This week */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-600 dark:text-gray-400">This week</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-giuseppe-cream">
              {data.thisWeekFinalized} finalised / {data.thisWeekDaysElapsed} days
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-giuseppe-border rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                weekPct === 100
                  ? "bg-green-500"
                  : weekPct >= 60
                  ? "bg-brand-400"
                  : "bg-red-400"
              }`}
              style={{ width: `${weekPct}%` }}
            />
          </div>
          {data.thisWeekMissingDays > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {data.thisWeekMissingDays} missing day{data.thisWeekMissingDays !== 1 ? "s" : ""} this week
            </p>
          )}
        </div>

        {/* This month */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">This month</span>
          <span className="text-sm font-medium text-gray-900 dark:text-giuseppe-cream">
            {data.thisMonthFinalized} / {data.thisMonthTotal} finalised
          </span>
        </div>

        {/* Missing dates */}
        {data.recentMissingDates.length > 0 && (
          <div className="border-t border-gray-100 dark:border-giuseppe-border pt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
              Recent missing reports:
            </p>
            <div className="flex flex-wrap gap-1">
              {data.recentMissingDates.map((d, i) => (
                <span
                  key={i}
                  className="text-xs bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded"
                >
                  {fmtDate(d)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
