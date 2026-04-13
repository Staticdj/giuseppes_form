import Link from "next/link";
import { AppHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { ReportFilters } from "./ReportFilters";
import { getFilteredReports } from "@/lib/dashboard/aggregations";
import type { ReportFilters as FilterType } from "@/lib/dashboard/types";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    from?: string;
    to?: string;
    enteredBy?: string;
    busyLevel?: string;
    eventRunning?: string;
    page?: string;
  }>;
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtMoney(v: unknown): string {
  if (!v) return "—";
  const n = parseFloat(String(v));
  return isNaN(n) || n === 0 ? "—" : `$${n.toFixed(2)}`;
}

function sumTrade(r: {
  cash: unknown;
  eftpos: unknown;
  vouchers: unknown;
  hotelChargeback: unknown;
}): string {
  const total =
    [r.cash, r.eftpos, r.vouchers, r.hotelChargeback].reduce<number>(
      (acc, v) => acc + (parseFloat(String(v ?? 0)) || 0),
      0
    );
  return total > 0 ? `$${total.toFixed(2)}` : "—";
}

export default async function DashboardReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);

  const filters: FilterType = {
    status:
      params.status === "DRAFT" || params.status === "FINALIZED"
        ? params.status
        : undefined,
    from: params.from ? new Date(params.from) : undefined,
    to: params.to ? new Date(params.to) : undefined,
    enteredBy: params.enteredBy || undefined,
    busyLevel: params.busyLevel || undefined,
    eventRunning:
      params.eventRunning === "true"
        ? true
        : params.eventRunning === "false"
        ? false
        : undefined,
    page,
  };

  const { reports, total, pageCount } = await getFilteredReports(filters);

  const currentFilters = {
    status: params.status ?? "",
    from: params.from ?? "",
    to: params.to ?? "",
    enteredBy: params.enteredBy ?? "",
    busyLevel: params.busyLevel ?? "",
    eventRunning: params.eventRunning ?? "",
  };

  function buildPageUrl(p: number) {
    const sp = new URLSearchParams();
    Object.entries(currentFilters).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    if (p > 1) sp.set("page", String(p));
    return `/dashboard/reports?${sp.toString()}`;
  }

  return (
    <div className="min-h-screen bg-giuseppe-cream dark:bg-giuseppe-dark">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-giuseppe-cream">Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {total} report{total !== 1 ? "s" : ""} found
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              ← Dashboard
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <ReportFilters current={currentFilters} />

        {/* Results */}
        {reports.length === 0 ? (
          <div className="bg-white dark:bg-giuseppe-card rounded-xl border border-dashed border-gray-300 dark:border-giuseppe-border p-10 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No reports match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => {
              const statusColor =
                report.status === "FINALIZED"
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                  : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400";
              return (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="block bg-white dark:bg-giuseppe-card rounded-xl border border-gray-200 dark:border-giuseppe-border px-4 py-3 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-giuseppe-cream text-sm">
                          {report.venueName}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor}`}
                        >
                          {report.status}
                        </span>
                        {report.isBackdated && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-full">
                            Backdated
                          </span>
                        )}
                        {report.eventRunning && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                            Event
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {fmtDate(report.reportDate)} · {report.dayOfWeek} · by{" "}
                        {report.enteredBy}
                      </p>
                      {report.busyLevel && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {report.busyLevel}
                          {report.weatherCondition
                            ? ` · ${report.weatherCondition}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 dark:text-giuseppe-cream text-sm">
                        {sumTrade(report)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {report.createdBy.name}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between mt-5">
            <Link href={page > 1 ? buildPageUrl(page - 1) : "#"}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
              >
                ← Previous
              </Button>
            </Link>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {pageCount}
            </span>
            <Link href={page < pageCount ? buildPageUrl(page + 1) : "#"}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pageCount}
              >
                Next →
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
