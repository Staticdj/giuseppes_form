import type { MonthlyResult } from "@/lib/dashboard/types";
import { BarChart } from "./BarChart";
import { buildMonthlyChartBars } from "@/lib/dashboard/aggregations";

interface Props {
  data: MonthlyResult;
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
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}

export function MonthlyView({ data }: Props) {
  const bars = buildMonthlyChartBars(data);
  const hasData = data.totalTrade > 0;

  return (
    <div>
      {/* Weekly trend chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Weekly Trade Trend — {data.monthName} {data.year}
        </h3>
        <BarChart bars={bars} emptyMessage={`No reports in ${data.monthName}`} />
      </div>

      {hasData ? (
        <>
          <Section title="Monthly Summary">
            <SummaryRow label="Total Trade" value={fmt(data.totalTrade)} />
            <SummaryRow label="Avg Daily Trade" value={fmt(data.avgDailyTrade)} />
            <SummaryRow
              label="Best Trading Day"
              value={
                data.bestDay
                  ? `${data.bestDay.dayOfWeek} ${fmtDate(data.bestDay.date)} – ${fmt(data.bestDay.total)}`
                  : "—"
              }
            />
            <SummaryRow
              label="Best Week"
              value={
                data.bestWeek
                  ? `w/c ${fmtDate(data.bestWeek.weekStart)} – ${fmt(data.bestWeek.total)}`
                  : "—"
              }
            />
            <SummaryRow label="Total Voids" value={fmt(data.totalVoids)} />
            <SummaryRow label="Voucher Total" value={fmt(data.voucherTotal)} />
            <SummaryRow label="Hotel Chargeback" value={fmt(data.chargebackTotal)} />
          </Section>

          <Section title="Payment Breakdown">
            <SummaryRow label="Cash" value={fmt(data.totalCash)} />
            <SummaryRow label="EFTPOS" value={fmt(data.totalEftpos)} />
            <SummaryRow label="Sales Channel Total" value={fmt(data.salesChannelTotal)} />
          </Section>

          <Section title="Report Completion">
            <SummaryRow label="Finalised" value={data.finalisedCount} />
            <SummaryRow label="Total Reports" value={data.totalReports} />
            <SummaryRow
              label="Completion Rate"
              value={`${Math.round(data.completionRate)}%`}
            />
          </Section>

          {/* Weekly breakdown table */}
          {data.weeklyTotals.length > 0 && (
            <Section title="Weekly Breakdown">
              <div className="divide-y divide-gray-100">
                {data.weeklyTotals.map((w, i) => (
                  <div
                    key={i}
                    className="py-2 text-sm flex items-center justify-between"
                  >
                    <span className="text-gray-600">
                      w/c {fmtDate(w.weekStart)}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {fmt(w.total)}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-400 text-sm">
            No reports found for {data.monthName} {data.year}.
          </p>
        </div>
      )}
    </div>
  );
}
