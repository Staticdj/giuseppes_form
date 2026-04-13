"use client";

import { useRouter } from "next/navigation";

type ViewType = "daily" | "weekly" | "monthly";

interface DashboardNavProps {
  view: ViewType;
  dateStr: string;
}

function addDaysToStr(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function addMonthsToStr(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split("T")[0];
}

function formatPeriodLabel(view: ViewType, dateStr: string): string {
  const d = new Date(dateStr);
  if (view === "daily") {
    return d.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (view === "weekly") {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return d.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}

export function DashboardNav({ view, dateStr }: DashboardNavProps) {
  const router = useRouter();

  function navigate(newView: ViewType, newDate: string) {
    router.push(`/dashboard?view=${newView}&date=${newDate}`);
  }

  function prev() {
    if (view === "daily") navigate(view, addDaysToStr(dateStr, -1));
    else if (view === "weekly") navigate(view, addDaysToStr(dateStr, -7));
    else navigate(view, addMonthsToStr(dateStr, -1));
  }

  function next() {
    if (view === "daily") navigate(view, addDaysToStr(dateStr, 1));
    else if (view === "weekly") navigate(view, addDaysToStr(dateStr, 7));
    else navigate(view, addMonthsToStr(dateStr, 1));
  }

  function goToday() {
    navigate(view, new Date().toISOString().split("T")[0]);
  }

  const views: { key: ViewType; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  return (
    <div className="bg-white dark:bg-giuseppe-darker border-b border-gray-200 dark:border-giuseppe-border sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 dark:border-giuseppe-border overflow-hidden text-sm">
          {views.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => navigate(key, dateStr)}
              className={`flex-1 px-4 py-2 font-medium transition-colors ${
                view === key
                  ? "bg-brand-600 text-white"
                  : "bg-white dark:bg-giuseppe-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-giuseppe-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="p-2 rounded-lg border border-gray-200 dark:border-giuseppe-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-giuseppe-border text-sm"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            onClick={goToday}
            className="px-3 py-2 text-xs font-medium text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20"
          >
            Today
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-0 truncate max-w-[200px]">
            {formatPeriodLabel(view, dateStr)}
          </span>
          <button
            onClick={next}
            className="p-2 rounded-lg border border-gray-200 dark:border-giuseppe-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-giuseppe-border text-sm"
            aria-label="Next"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
