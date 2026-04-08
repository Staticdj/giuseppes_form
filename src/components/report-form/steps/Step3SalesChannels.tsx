"use client";

import { useFormContext } from "../FormContext";
import { FormField } from "@/components/ui/FormField";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

function calcTotal(fields: string[]): string {
  const sum = fields.reduce((acc, v) => {
    const n = parseFloat(v);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);
  return sum > 0 ? `$${sum.toFixed(2)}` : "—";
}

export function Step3SalesChannels() {
  const { data, update, errors } = useFormContext();

  const total = calcTotal([
    data.online,
    data.phone,
    data.dineIn,
    data.takeaway,
    data.deliveries,
  ]);

  return (
    <div className="space-y-5">
      <FormField label="Online" htmlFor="online" error={errors.online}>
        <CurrencyInput
          id="online"
          value={data.online}
          onChange={(e) => update({ online: e.target.value })}
          error={!!errors.online}
          placeholder="0.00"
        />
      </FormField>

      <FormField label="Phone" htmlFor="phone" error={errors.phone}>
        <CurrencyInput
          id="phone"
          value={data.phone}
          onChange={(e) => update({ phone: e.target.value })}
          error={!!errors.phone}
          placeholder="0.00"
        />
      </FormField>

      <FormField label="Dine In" htmlFor="dineIn" error={errors.dineIn}>
        <CurrencyInput
          id="dineIn"
          value={data.dineIn}
          onChange={(e) => update({ dineIn: e.target.value })}
          error={!!errors.dineIn}
          placeholder="0.00"
        />
      </FormField>

      <FormField label="Takeaway" htmlFor="takeaway" error={errors.takeaway}>
        <CurrencyInput
          id="takeaway"
          value={data.takeaway}
          onChange={(e) => update({ takeaway: e.target.value })}
          error={!!errors.takeaway}
          placeholder="0.00"
        />
      </FormField>

      <FormField
        label="Deliveries"
        htmlFor="deliveries"
        error={errors.deliveries}
      >
        <CurrencyInput
          id="deliveries"
          value={data.deliveries}
          onChange={(e) => update({ deliveries: e.target.value })}
          error={!!errors.deliveries}
          placeholder="0.00"
        />
      </FormField>

      <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-orange-800">
            Sales Channel Total (reference)
          </span>
          <span className="text-lg font-bold text-orange-700">{total}</span>
        </div>
        <p className="text-xs text-orange-600 mt-1">
          Mismatches with financials do not block submission.
        </p>
      </div>
    </div>
  );
}
