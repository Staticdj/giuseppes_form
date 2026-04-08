import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getReports } from "@/actions/report";
import { AppHeader } from "@/components/layout/Header";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-AU", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const reports = await getReports();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              End of Trade Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {reports.length} report{reports.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/reports/new">
            <Button variant="primary" size="md">
              + New Report
            </Button>
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-lg">No reports yet.</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">
              Create your first End of Trade report.
            </p>
            <Link href="/reports/new">
              <Button variant="primary">Create Report</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-orange-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {report.venueName}
                      </span>
                      {report.isBackdated && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          Backdated
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {formatDate(report.reportDate)} · {report.dayOfWeek}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      By {report.createdBy.name}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge
                      status={report.status as "DRAFT" | "FINALIZED"}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
