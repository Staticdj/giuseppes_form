import type { WeeklyResult } from "@/lib/dashboard/types";
import { BarChart } from "./BarChart";
import { buildWeeklyChartBars } from "@/lib/dashboard/aggregations";

interface Props {
  data: WeeklyResult;
}

function fmt(v: number): string {
  return v > 0 ? `$${v.toFixed(2)}` : "—";
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-giuseppe-border last:border-0 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-giuseppe-cream">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-giuseppe-card rounded-xl border border-gray-200 dark:border-giuseppe-border overflow-hidden mb-4">
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-giuseppe-darker border-b border-gray-200 dark:border-giuseppe-border">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}

export function WeeklyView({ data }: Props) {
  const bars = buildWeeklyChartBars(data);
  const hasAnyData = data.totalTrade > 0;

  return (
    <div>
      {/* Trade trend chart */}
      <div className="bg-white dark:bg-giuseppe-card rounded-xl border border-gray-200 dark:border-giuseppe-border p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Daily Trade —{" "}
          {data.weekStart.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} to{" "}
          {new Date(data.weekEnd.getTime() - 1).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
        </h3>
        <BarChart bars={bars} emptyMessage="No reports this week" />
      </div>

      {hasAnyData ? (
        <>
          <Section title="Weekly Totals">
            <SummaryRow label="Total Trade" value={fmt(data.totalTrade)} />
            <SummaryRow label="Avg Daily Trade" value={fmt(data.avgDailyTrade)} />
            <SummaryRow
              label="Best Day"
              value={data.bestDay ? `${data.bestDay.dayOfWeek} – ${fmt(data.bestDay.total)}` : "—"}
            />
            <SummaryRow
              label="Lowest Day"
              value={data.worstDay ? `${data.worstDay.dayOfWeek} – ${fmt(data.worstDay.total)}` : "—"}
            />
            <SummaryRow label="Total Voids" value={fmt(data.totalVoids)} />
          </Section>

          <Section title="Payment Breakdown">
            <SummaryRow label="Cash" value={fmt(data.totalCash)} />
            <SummaryRow label="EFTPOS" value={fmt(data.totalEftpos)} />
            <SummaryRow label="Vouchers" value={fmt(data.totalVouchers)} />
            <SummaryRow label="Hotel Chargeback" value={fmt(data.totalChargeback)} />
          </Section>

          <Section title="Sales Channels">
            <SummaryRow label="Online" value={fmt(data.totalOnline)} />
            <SummaryRow label="Phone" value={fmt(data.totalPhone)} />
            <SummaryRow label="Dine In" value={fmt(data.totalDineIn)} />
            <SummaryRow label="Takeaway" value={fmt(data.totalTakeaway)} />
            <SummaryRow label="Deliveries" value={fmt(data.totalDeliveries)} />
          </Section>

          <Section title="Report Compliance">
            <SummaryRow
              label="Finalised"
              value={`${data.finalisedCount} / ${data.days.filter((d) => d.hasReport).length}`}
            />
            <SummaryRow label="Drafts" value={String(data.draftCount)} />
            <SummaryRow
              label="Missing Days"
              value={data.missingDays.length > 0 ? data.missingDays.map((d) => fmtDate(d)).join(", ") : "None"}
            />
          </Section>

          {(data.eventDays > 0 || data.weatherTags.length > 0) && (
            <Section title="Operations">
              <SummaryRow label="Event Days" value={String(data.eventDays)} />
              {data.weatherTags.length > 0 && (
                <SummaryRow label="Weather" value={data.weatherTags.join(", ")} />
              )}
            </Section>
          )}

          {/* Day-by-day list */}
          <Section title="Day by Day">
            <div className="divide-y divide-gray-100 dark:divide-giuseppe-border">
              {data.days.map((d, i) => (
                <div key={i} className="py-2 text-sm flex items-center justify-between">
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {fmtDate(d.date)}
                    </span>
                    {d.report && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                        {d.report.enteredBy}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {d.report ? (
                      <>
                        <span className="font-semibold text-gray-900 dark:text-giuseppe-cream">
                          {fmt(d.report.totalTrade)}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            d.report.status === "FINALIZED"
                              ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                              : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400"
                          }`}
                        >
                          {d.report.status === "FINALIZED" ? "Final" : "Draft"}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-xs italic">No report</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      ) : (
        <div className="bg-white dark:bg-giuseppe-card rounded-xl border border-dashed border-gray-300 dark:border-giuseppe-border p-10 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No reports found for this week.</p>
        </div>
      )}
    </div>
  );
}
