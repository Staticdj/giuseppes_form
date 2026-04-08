"use client";

import { useFormContext } from "../FormContext";
import { StatusBadge } from "@/components/ui/StatusBadge";

function fmt(v: string | undefined): string {
  if (!v) return "—";
  const n = parseFloat(v);
  return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
}

function fmtInt(v: string | undefined): string {
  if (!v) return "—";
  return v;
}

interface Step8Props {
  isFinalised?: boolean;
}

export function Step8Finalise({ isFinalised = false }: Step8Props) {
  const { data } = useFormContext();

  const financialTotal =
    [data.cash, data.eftpos, data.vouchers, data.hotelChargeback].reduce(
      (acc, v) => acc + (parseFloat(v) || 0),
      0
    ) || null;

  const salesTotal =
    [data.online, data.phone, data.dineIn, data.takeaway, data.deliveries].reduce(
      (acc, v) => acc + (parseFloat(v) || 0),
      0
    ) || null;

  const mismatch =
    financialTotal !== null &&
    salesTotal !== null &&
    Math.abs(financialTotal - salesTotal) > 0.01;

  return (
    <div className="space-y-6">
      {isFinalised && (
        <div className="flex items-center gap-2">
          <StatusBadge status="FINALIZED" />
          <span className="text-sm text-gray-500">This report is finalised.</span>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg divide-y divide-gray-200 text-sm">
        {/* Report Info */}
        <div className="px-4 py-3">
          <p className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-2">
            Report Info
          </p>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-500">Venue</span>
            <span className="text-gray-900 font-medium">{data.venueName || "—"}</span>
            <span className="text-gray-500">Date</span>
            <span className="text-gray-900 font-medium">{data.reportDate || "—"}</span>
            <span className="text-gray-500">Day</span>
            <span className="text-gray-900 font-medium">{data.dayOfWeek || "—"}</span>
            <span className="text-gray-500">Entered by</span>
            <span className="text-gray-900 font-medium">{data.enteredBy || "—"}</span>
          </div>
        </div>

        {/* Financials */}
        <div className="px-4 py-3">
          <p className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-2">
            Financial Totals
          </p>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-500">Cash</span>
            <span>{fmt(data.cash)}</span>
            <span className="text-gray-500">EFTPOS</span>
            <span>{fmt(data.eftpos)}</span>
            <span className="text-gray-500">Vouchers</span>
            <span>{fmt(data.vouchers)}</span>
            <span className="text-gray-500">Hotel Chargeback</span>
            <span>{fmt(data.hotelChargeback)}</span>
            <span className="font-medium text-gray-800">Financial Total</span>
            <span className="font-medium">
              {financialTotal !== null ? `$${financialTotal.toFixed(2)}` : "—"}
            </span>
          </div>
        </div>

        {/* Sales Channels */}
        <div className="px-4 py-3">
          <p className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-2">
            Sales Channels
          </p>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-500">Online</span>
            <span>{fmt(data.online)}</span>
            <span className="text-gray-500">Phone</span>
            <span>{fmt(data.phone)}</span>
            <span className="text-gray-500">Dine In</span>
            <span>{fmt(data.dineIn)}</span>
            <span className="text-gray-500">Takeaway</span>
            <span>{fmt(data.takeaway)}</span>
            <span className="text-gray-500">Deliveries</span>
            <span>{fmt(data.deliveries)}</span>
            <span className="font-medium text-gray-800">Sales Total</span>
            <span className="font-medium">
              {salesTotal !== null ? `$${salesTotal.toFixed(2)}` : "—"}
            </span>
          </div>
          {mismatch && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠ Financial and sales channel totals don't match — this is for
              reference only and won't block submission.
            </div>
          )}
        </div>

        {/* Staffing */}
        <div className="px-4 py-3">
          <p className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-2">
            Staffing
          </p>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-gray-500">FOH Juniors</span>
            <span>{fmtInt(data.fohJuniors)}</span>
            <span className="text-gray-500">FOH RSA</span>
            <span>{fmtInt(data.fohRsa)}</span>
            <span className="text-gray-500">Voids</span>
            <span>{fmt(data.voids)}</span>
          </div>
        </div>

        {/* Sign-Off */}
        <div className="px-4 py-3">
          <p className="font-medium text-gray-500 text-xs uppercase tracking-wide mb-2">
            Sign-Off
          </p>
          {data.signedOff && data.signedOffBy ? (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <span className="text-base">✓</span>
              Signed off by <strong>{data.signedOffBy}</strong>
            </div>
          ) : (
            <div className="text-amber-700 text-sm flex items-center gap-2">
              <span>⚠</span>
              Sign-off required before finalising — return to Step 7.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
