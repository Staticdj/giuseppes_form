import type { DailyResult } from "@/lib/dashboard/types";

interface Props {
  data: DailyResult;
}

function fmt(v: number): string {
  return v > 0 ? `$${v.toFixed(2)}` : "—";
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
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

export function DailyView({ data }: Props) {
  const { report, date } = data;

  if (!report) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center mb-4">
        <p className="text-gray-400 text-sm">No report found for this date.</p>
        <p className="text-gray-300 text-xs mt-1">
          {date.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    );
  }

  const r = report;
  const statusColor =
    r.status === "FINALIZED"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div>
      {/* Report status pill */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
          {r.status}
        </span>
        {r.isBackdated && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
            Backdated
          </span>
        )}
        <span className="text-xs text-gray-400">
          Entered by {r.enteredBy}
        </span>
      </div>

      <Section title="Financial Totals">
        <Row label="Cash" value={fmt(r.cash)} />
        <Row label="EFTPOS" value={fmt(r.eftpos)} />
        <Row label="Vouchers" value={fmt(r.vouchers)} />
        <Row label="Hotel Chargeback" value={fmt(r.hotelChargeback)} />
        <Row
          label="Total Trade"
          value={
            <strong className="text-orange-700">
              {fmt(r.totalTrade)}
            </strong>
          }
        />
      </Section>

      <Section title="Sales Channels">
        <Row label="Online" value={fmt(r.online)} />
        <Row label="Phone" value={fmt(r.phone)} />
        <Row label="Dine In" value={fmt(r.dineIn)} />
        <Row label="Takeaway" value={fmt(r.takeaway)} />
        <Row label="Deliveries" value={fmt(r.deliveries)} />
        {r.salesChannelTotal > 0 && (
          <Row
            label="Channel Total"
            value={<strong>{fmt(r.salesChannelTotal)}</strong>}
          />
        )}
      </Section>

      <Section title="Staffing">
        <Row
          label="FOH Juniors"
          value={r.fohJuniors !== null ? String(r.fohJuniors) : "—"}
        />
        <Row label="FOH RSA" value={r.fohRsa !== null ? String(r.fohRsa) : "—"} />
        <Row label="Voids" value={fmt(r.voids)} />
      </Section>

      <Section title="Operations">
        <Row label="Busy Level" value={r.busyLevel ?? "—"} />
        <Row label="Event Running" value={r.eventRunning ? "Yes" : "No"} />
        {r.eventRunning && r.eventName && (
          <Row label="Event" value={`${r.eventName}${r.eventType ? ` (${r.eventType})` : ""}`} />
        )}
        <Row label="Weather" value={r.weatherCondition ?? "—"} />
        {r.weatherImpactNote && (
          <Row label="Weather Note" value={r.weatherImpactNote} />
        )}
        {r.notes && (
          <div className="py-2 text-sm">
            <p className="text-gray-500 text-xs mb-1">Notes</p>
            <p className="text-gray-900 whitespace-pre-wrap text-sm">{r.notes}</p>
          </div>
        )}
      </Section>

      <Section title="Sign-Off">
        <Row label="Signed Off" value={r.signedOff ? "Yes" : "No"} />
        <Row label="Signed By" value={r.signedOffBy ?? "—"} />
        <Row
          label="Signed At"
          value={
            r.signedOffAt
              ? new Date(r.signedOffAt).toLocaleString("en-AU")
              : "—"
          }
        />
        {r.finalizedAt && (
          <Row
            label="Finalised At"
            value={new Date(r.finalizedAt).toLocaleString("en-AU")}
          />
        )}
      </Section>
    </div>
  );
}
