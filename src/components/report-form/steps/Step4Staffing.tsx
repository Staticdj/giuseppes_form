"use client";

import { useFormContext } from "../FormContext";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

export function Step4Staffing() {
  const { data, update, errors } = useFormContext();

  return (
    <div className="space-y-5">
      <FormField
        label="FOH Juniors (count)"
        htmlFor="fohJuniors"
        error={errors.fohJuniors}
        hint="Number of junior front-of-house staff on shift"
      >
        <Input
          id="fohJuniors"
          type="number"
          inputMode="numeric"
          min="0"
          value={data.fohJuniors}
          onChange={(e) => update({ fohJuniors: e.target.value })}
          error={!!errors.fohJuniors}
          placeholder="0"
        />
      </FormField>

      <FormField
        label="FOH RSA (count)"
        htmlFor="fohRsa"
        error={errors.fohRsa}
        hint="Number of RSA-certified front-of-house staff on shift"
      >
        <Input
          id="fohRsa"
          type="number"
          inputMode="numeric"
          min="0"
          value={data.fohRsa}
          onChange={(e) => update({ fohRsa: e.target.value })}
          error={!!errors.fohRsa}
          placeholder="0"
        />
      </FormField>

      <FormField
        label="Voids"
        htmlFor="voids"
        error={errors.voids}
        hint="Total value of voided transactions"
      >
        <CurrencyInput
          id="voids"
          value={data.voids}
          onChange={(e) => update({ voids: e.target.value })}
          error={!!errors.voids}
          placeholder="0.00"
        />
      </FormField>
    </div>
  );
}
