import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getReport } from "@/actions/report";
import { canReopen } from "@/lib/roles";
import { AppHeader } from "@/components/layout/Header";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ReopenButton } from "@/components/report/ReopenButton";
import type { Decimal } from "@prisma/client/runtime/library";

function fmt(v: Decimal | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const n = parseFloat(v.toString());
  return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
}

function fmtSum(...vals: (Decimal | null | undefined)[]): string {
  const sum = vals.reduce<number>(
    (acc, v) => acc + (v ? parseFloat(v.toString()) || 0 : 0),
    0
  );
  return sum > 0 ? `$${sum.toFixed(2)}` : "—";
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtDateTime(d: Date): string {
  return new Date(d).toLocaleString("en-AU");
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-giuseppe-border last:border-0 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-giuseppe-cream font-medium text-right">{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-giuseppe-card rounded-xl border border-gray-200 dark:border-giuseppe-border overflow-hidden mb-4">
      <div className="px-5 py-3 bg-gray-50 dark:bg-giuseppe-darker border-b border-gray-200 dark:border-giuseppe-border">
        <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
          {title}
        </h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const report = await getReport(id);
  if (!report) notFound();

  const userCanReopen = canReopen(session.user.role);
  const isFinalized = report.status === "FINALIZED";

  return (
    <div className="min-h-screen bg-giuseppe-cream dark:bg-giuseppe-dark">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-giuseppe-cream">
                {report.venueName}
              </h1>
              <StatusBadge status={report.status as "DRAFT" | "FINALIZED"} />
              {report.isBackdated && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
                  Backdated
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fmtDate(report.reportDate)}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!isFinalized && (
              <Link href={`/reports/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
            )}
            {isFinalized && userCanReopen && (
              <ReopenButton reportId={id} />
            )}
          </div>
        </div>

        {/* Sections */}
        <Section title="Report Info">
          <Row label="Venue" value={report.venueName} />
          <Row label="Date" value={fmtDate(report.reportDate)} />
          <Row label="Day" value={report.dayOfWeek} />
          <Row label="Entered By" value={report.enteredBy} />
          <Row label="Created By" value={report.createdBy.name} />
          <Row label="Created At" value={fmtDateTime(report.createdAt)} />
          {report.finalizedAt && (
            <Row label="Finalised At" value={fmtDateTime(report.finalizedAt)} />
          )}
        </Section>

        <Section title="Financial Totals">
          <Row label="Cash" value={fmt(report.cash)} />
          <Row label="EFTPOS" value={fmt(report.eftpos)} />
          <Row label="Vouchers" value={fmt(report.vouchers)} />
          <Row label="Hotel Chargeback" value={fmt(report.hotelChargeback)} />
          <Row
            label="Total"
            value={
              <strong>
                {fmtSum(report.cash, report.eftpos, report.vouchers, report.hotelChargeback)}
              </strong>
            }
          />
        </Section>

        <Section title="Sales Channels">
          <Row label="Online" value={fmt(report.online)} />
          <Row label="Phone" value={fmt(report.phone)} />
          <Row label="Dine In" value={fmt(report.dineIn)} />
          <Row label="Takeaway" value={fmt(report.takeaway)} />
          <Row label="Deliveries" value={fmt(report.deliveries)} />
        </Section>

        <Section title="Staffing">
          <Row label="FOH Juniors" value={report.fohJuniors ?? "—"} />
          <Row label="FOH RSA" value={report.fohRsa ?? "—"} />
          <Row label="Voids" value={fmt(report.voids)} />
        </Section>

        {(report.notes || report.busyLevel || report.eventRunning) && (
          <Section title="Notes & Operations">
            {report.busyLevel && (
              <Row label="Busy Level" value={report.busyLevel} />
            )}
            {report.eventRunning && (
              <>
                <Row label="Event Running" value="Yes" />
                {report.eventName && (
                  <Row label="Event Name" value={report.eventName} />
                )}
                {report.eventType && (
                  <Row label="Event Type" value={report.eventType} />
                )}
              </>
            )}
            {report.weatherCondition && (
              <Row label="Weather" value={report.weatherCondition} />
            )}
            {report.weatherImpactNote && (
              <Row label="Weather Note" value={report.weatherImpactNote} />
            )}
            {report.notes && (
              <div className="py-2 text-sm">
                <p className="text-gray-500 mb-1">Notes</p>
                <p className="text-gray-900 whitespace-pre-wrap">{report.notes}</p>
              </div>
            )}
          </Section>
        )}

        <Section title="Sign-Off">
          {report.signedOff ? (
            <>
              <Row label="Signed Off By" value={report.signedOffBy ?? "—"} />
              <Row
                label="Signed Off At"
                value={
                  report.signedOffAt
                    ? fmtDateTime(report.signedOffAt)
                    : "—"
                }
              />
            </>
          ) : (
            <p className="py-3 text-sm text-gray-400 italic">
              Not yet signed off.
            </p>
          )}
        </Section>

        {/* Audit Trail */}
        {report.auditLogs.length > 0 && (
          <Section title="Audit Trail">
            <div className="divide-y divide-gray-100">
              {report.auditLogs.map((log) => (
                <div key={log.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      {fmtDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                    {log.user.name} ({log.user.role})
                    {log.details ? ` — ${log.details}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="mt-6">
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              ← Back to Reports
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
