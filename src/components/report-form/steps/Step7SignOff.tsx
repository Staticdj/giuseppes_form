"use client";

import { useFormContext } from "../FormContext";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

export function Step7SignOff() {
  const { data, update, errors } = useFormContext();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Before you finalise:</p>
        <ul className="list-disc ml-4 space-y-1">
          <li>Review all sections are complete and accurate.</li>
          <li>Confirm the figures match your POS end-of-day report.</li>
          <li>Enter your full name and tick the sign-off checkbox.</li>
        </ul>
      </div>

      {/* Sign-off checkbox */}
      <div
        className={[
          "flex items-start gap-3 p-4 rounded-lg border-2",
          data.signedOff
            ? "border-green-400 bg-green-50"
            : "border-gray-300 bg-white",
        ].join(" ")}
      >
        <input
          id="signedOff"
          type="checkbox"
          checked={data.signedOff}
          onChange={(e) => update({ signedOff: e.target.checked })}
          className="mt-0.5 w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 flex-shrink-0"
        />
        <label
          htmlFor="signedOff"
          className="text-sm text-gray-700 cursor-pointer leading-snug"
        >
          I confirm that the information in this End of Trade report is accurate
          and complete to the best of my knowledge.
        </label>
      </div>
      {errors.signedOff && (
        <p className="text-xs text-red-600">⚠ {errors.signedOff}</p>
      )}

      {/* Full name */}
      <FormField
        label="Full Name"
        htmlFor="signedOffBy"
        error={errors.signedOffBy}
        required
        hint="Type your full name to confirm sign-off"
      >
        <Input
          id="signedOffBy"
          value={data.signedOffBy}
          onChange={(e) => update({ signedOffBy: e.target.value })}
          error={!!errors.signedOffBy}
          placeholder="e.g. Jane Smith"
          autoComplete="name"
        />
      </FormField>

      {data.signedOff && data.signedOffBy.trim() && (
        <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
          <span className="text-lg">✓</span>
          Signed off by {data.signedOffBy}
        </div>
      )}
    </div>
  );
}
