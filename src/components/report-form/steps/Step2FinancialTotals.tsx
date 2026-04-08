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

export function Step2FinancialTotals() {
  const { data, update, errors } = useFormContext();

  const total = calcTotal([
    data.cash,
    data.eftpos,
    data.vouchers,
    data.hotelChargeback,
  ]);

  return (
    <div className="space-y-5">
      <FormField label="Cash" htmlFor="cash" error={errors.cash}>
        <CurrencyInput
          id="cash"
          value={data.cash}
          onChange={(e) => update({ cash: e.target.value })}
          error={!!errors.cash}
          placeholder="0.00"
        />
      </FormField>

      <FormField label="EFTPOS" htmlFor="eftpos" error={errors.eftpos}>
        <CurrencyInput
          id="eftpos"
          value={data.eftpos}
          onChange={(e) => update({ eftpos: e.target.value })}
          error={!!errors.eftpos}
          placeholder="0.00"
        />
      </FormField>

      <FormField label="Vouchers" htmlFor="vouchers" error={errors.vouchers}>
        <CurrencyInput
          id="vouchers"
          value={data.vouchers}
          onChange={(e) => update({ vouchers: e.target.value })}
          error={!!errors.vouchers}
          placeholder="0.00"
        />
      </FormField>

      <FormField
        label="Hotel Chargeback"
        htmlFor="hotelChargeback"
        error={errors.hotelChargeback}
      >
        <CurrencyInput
          id="hotelChargeback"
          value={data.hotelChargeback}
          onChange={(e) => update({ hotelChargeback: e.target.value })}
          error={!!errors.hotelChargeback}
          placeholder="0.00"
        />
      </FormField>

      {/* Calculated total – reference only, does not block submission */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-orange-800">
            Financial Total (reference)
          </span>
          <span className="text-lg font-bold text-orange-700">{total}</span>
        </div>
        <p className="text-xs text-orange-600 mt-1">
          Calculated total is for reference only and does not block saving.
        </p>
      </div>
    </div>
  );
}
