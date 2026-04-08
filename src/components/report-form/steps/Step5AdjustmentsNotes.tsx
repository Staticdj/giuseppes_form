"use client";

import { useFormContext } from "../FormContext";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";

export function Step5AdjustmentsNotes() {
  const { data, update, errors } = useFormContext();

  return (
    <div className="space-y-5">
      <FormField
        label="Notes & Adjustments"
        htmlFor="notes"
        error={errors.notes}
        hint="Add any notes, adjustments, or explanations for this report."
      >
        <Textarea
          id="notes"
          value={data.notes}
          onChange={(e) => update({ notes: e.target.value })}
          error={!!errors.notes}
          placeholder="e.g. Short cash due to change run, discrepancy explained by..."
          rows={6}
        />
      </FormField>
    </div>
  );
}
