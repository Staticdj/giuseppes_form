"use client";

import { useFormContext } from "../FormContext";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const BUSY_LEVELS = [
  { value: "QUIET", label: "Quiet" },
  { value: "MODERATE", label: "Moderate" },
  { value: "BUSY", label: "Busy" },
  { value: "VERY_BUSY", label: "Very Busy" },
];

const WEATHER_CONDITIONS = [
  { value: "FINE", label: "Fine" },
  { value: "CLOUDY", label: "Cloudy" },
  { value: "RAIN", label: "Rain" },
  { value: "STORM", label: "Storm" },
  { value: "HOT", label: "Hot" },
];

const EVENT_TYPES = [
  { value: "SPORTS", label: "Sports" },
  { value: "CONCERT", label: "Concert" },
  { value: "CONFERENCE", label: "Conference" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "PRIVATE", label: "Private Function" },
  { value: "OTHER", label: "Other" },
];

export function Step6SmartAdditions() {
  const { data, update, errors } = useFormContext();

  return (
    <div className="space-y-5">
      <FormField
        label="How Busy Was It?"
        htmlFor="busyLevel"
        error={errors.busyLevel}
      >
        <Select
          id="busyLevel"
          value={data.busyLevel}
          onChange={(e) => update({ busyLevel: e.target.value })}
          options={BUSY_LEVELS}
          placeholder="Select busy level"
          error={!!errors.busyLevel}
        />
      </FormField>

      {/* Event Running toggle */}
      <div className="flex items-center gap-3">
        <input
          id="eventRunning"
          type="checkbox"
          checked={data.eventRunning}
          onChange={(e) => update({ eventRunning: e.target.checked })}
          className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
        />
        <label
          htmlFor="eventRunning"
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          Event running tonight?
        </label>
      </div>

      {data.eventRunning && (
        <div className="space-y-4 pl-4 border-l-2 border-orange-200">
          <FormField
            label="Event Name"
            htmlFor="eventName"
            error={errors.eventName}
          >
            <Input
              id="eventName"
              value={data.eventName}
              onChange={(e) => update({ eventName: e.target.value })}
              error={!!errors.eventName}
              placeholder="e.g. Trivia Night"
            />
          </FormField>

          <FormField
            label="Event Type"
            htmlFor="eventType"
            error={errors.eventType}
          >
            <Select
              id="eventType"
              value={data.eventType}
              onChange={(e) => update({ eventType: e.target.value })}
              options={EVENT_TYPES}
              placeholder="Select event type"
              error={!!errors.eventType}
            />
          </FormField>
        </div>
      )}

      <FormField
        label="Weather Condition"
        htmlFor="weatherCondition"
        error={errors.weatherCondition}
      >
        <Select
          id="weatherCondition"
          value={data.weatherCondition}
          onChange={(e) => update({ weatherCondition: e.target.value })}
          options={WEATHER_CONDITIONS}
          placeholder="Select weather"
          error={!!errors.weatherCondition}
        />
      </FormField>

      <FormField
        label="Weather Impact Note"
        htmlFor="weatherImpactNote"
        error={errors.weatherImpactNote}
        hint="Did weather affect trade? Describe briefly."
      >
        <Textarea
          id="weatherImpactNote"
          value={data.weatherImpactNote}
          onChange={(e) => update({ weatherImpactNote: e.target.value })}
          error={!!errors.weatherImpactNote}
          placeholder="e.g. Heavy rain kept foot traffic down..."
          rows={3}
        />
      </FormField>
    </div>
  );
}
