import Link from "next/link";
import { AppHeader } from "@/components/layout/Header";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DailyView } from "@/components/dashboard/DailyView";
import { WeeklyView } from "@/components/dashboard/WeeklyView";
import { MonthlyView } from "@/components/dashboard/MonthlyView";
import { CompliancePanel } from "@/components/dashboard/CompliancePanel";
import { NotesPanel } from "@/components/dashboard/NotesPanel";
import { DashboardNav } from "./DashboardNav";
import {
  getDailyResult,
  getWeeklyResult,
  getMonthlyResult,
  getComplianceData,
  getRecentNotes,
  deriveKpis,
  startOfDay,
  startOfWeek,
} from "@/lib/dashboard/aggregations";

type ViewType = "daily" | "weekly" | "monthly";

interface PageProps {
  searchParams: Promise<{ view?: string; date?: string }>;
}

function parseDate(str: string | undefined): Date {
  if (!str) return new Date();
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

function parsedView(raw: string | undefined): ViewType {
  if (raw === "weekly" || raw === "monthly") return raw;
  return "daily";
}

function fmt(v: number): string {
  if (v === 0) return "—";
  return `$${v.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const view = parsedView(params.view);
  const date = parseDate(params.date);
  const dateStr = startOfDay(date).toISOString().split("T")[0];

  // Fetch data based on view
  let viewContent: React.ReactNode;
  let kpis;

  if (view === "daily") {
    const data = await getDailyResult(date);
    kpis = deriveKpis("daily", data, date);
    viewContent = <DailyView data={data} />;
  } else if (view === "weekly") {
    const weekStart = startOfWeek(date);
    const data = await getWeeklyResult(weekStart);
    kpis = deriveKpis("weekly", data, date);
    viewContent = <WeeklyView data={data} />;
  } else {
    const data = await getMonthlyResult(date.getFullYear(), date.getMonth() + 1);
    kpis = deriveKpis("monthly", data, date);
    viewContent = <MonthlyView data={data} />;
  }

  const [compliance, notes] = await Promise.all([
    getComplianceData(),
    getRecentNotes(8),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <DashboardNav view={view} dateStr={dateStr} />

      <main className="max-w-3xl mx-auto px-4 py-5">
        {/* Page heading + links */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-400">{kpis.periodLabel}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/reports"
              className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
            >
              Reports
            </Link>
            <Link
              href="/settings"
              className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <KpiCard
            label="Total Trade"
            value={fmt(kpis.totalTrade)}
            accent
          />
          <KpiCard label="Avg Daily" value={fmt(kpis.avgDailyTrade)} />
          <KpiCard label="Cash" value={fmt(kpis.totalCash)} />
          <KpiCard label="EFTPOS" value={fmt(kpis.totalEftpos)} />
          <KpiCard label="Voids" value={fmt(kpis.totalVoids)} />
          <KpiCard
            label="Finalised"
            value={String(kpis.finalisedCount)}
            sub={view !== "daily" ? "reports" : undefined}
          />
        </div>

        {/* Main view content */}
        {viewContent}

        {/* Compliance + Notes side by side on wider screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CompliancePanel data={compliance} />
          <NotesPanel entries={notes} />
        </div>
      </main>
    </div>
  );
}
