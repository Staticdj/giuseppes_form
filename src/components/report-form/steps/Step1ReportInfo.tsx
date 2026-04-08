"use client";

import { useEffect } from "react";
import { useFormContext } from "../FormContext";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
].map((d) => ({ value: d, label: d }));

interface Step1Props {
  canBackdate: boolean;
}

export function Step1ReportInfo({ canBackdate }: Step1Props) {
  const { data, update, errors } = useFormContext();

  // Auto-set today's date and day of week on mount if not already set
  useEffect(() => {
    if (!data.reportDate) {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const dayStr = today.toLocaleDateString("en-AU", { weekday: "long" });
      update({ reportDate: dateStr, dayOfWeek: dayStr });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync day of week when date changes
  function handleDateChange(value: string) {
    const d = new Date(value + "T12:00:00");
    const dayStr = d.toLocaleDateString("en-AU", { weekday: "long" });
    update({ reportDate: value, dayOfWeek: dayStr });
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-5">
      <FormField
        label="Venue Name"
        htmlFor="venueName"
        error={errors.venueName}
        required
      >
        <Input
          id="venueName"
          value={data.venueName}
          onChange={(e) => update({ venueName: e.target.value })}
          error={!!errors.venueName}
          placeholder="Giuseppe's Restaurant"
        />
      </FormField>

      <FormField
        label="Report Date"
        htmlFor="reportDate"
        error={errors.reportDate}
        required
        hint={
          !canBackdate
            ? "Today's date only. Managers can backdate."
            : "You can select a past date."
        }
      >
        <Input
          id="reportDate"
          type="date"
          value={data.reportDate}
          max={today}
          onChange={(e) => handleDateChange(e.target.value)}
          error={!!errors.reportDate}
          {...(!canBackdate ? { min: today } : {})}
        />
      </FormField>

      <FormField
        label="Day of Week"
        htmlFor="dayOfWeek"
        error={errors.dayOfWeek}
        required
      >
        <Select
          id="dayOfWeek"
          value={data.dayOfWeek}
          onChange={(e) => update({ dayOfWeek: e.target.value })}
          options={DAYS}
          placeholder="Select day"
          error={!!errors.dayOfWeek}
        />
      </FormField>

      <FormField
        label="Entered By"
        htmlFor="enteredBy"
        error={errors.enteredBy}
        required
      >
        <Input
          id="enteredBy"
          value={data.enteredBy}
          onChange={(e) => update({ enteredBy: e.target.value })}
          error={!!errors.enteredBy}
          placeholder="Your name"
        />
      </FormField>
    </div>
  );
}
