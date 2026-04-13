"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface FilterValues {
  status: string;
  from: string;
  to: string;
  enteredBy: string;
  busyLevel: string;
  eventRunning: string;
}

interface ReportFiltersProps {
  current: FilterValues;
}

const inputClass =
  "w-full border border-gray-300 dark:border-giuseppe-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-giuseppe-card text-gray-900 dark:text-giuseppe-cream focus:outline-none focus:ring-2 focus:ring-brand-600";

export function ReportFilters({ current }: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState<FilterValues>(current);

  function set(key: keyof FilterValues, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function apply() {
    const params = new URLSearchParams();
    if (values.status) params.set("status", values.status);
    if (values.from) params.set("from", values.from);
    if (values.to) params.set("to", values.to);
    if (values.enteredBy) params.set("enteredBy", values.enteredBy);
    if (values.busyLevel) params.set("busyLevel", values.busyLevel);
    if (values.eventRunning) params.set("eventRunning", values.eventRunning);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setValues({ status: "", from: "", to: "", enteredBy: "", busyLevel: "", eventRunning: "" });
    router.push(pathname);
  }

  const hasFilters = Object.values(values).some(Boolean);

  return (
    <div className="bg-white dark:bg-giuseppe-card rounded-xl border border-gray-200 dark:border-giuseppe-border p-4 mb-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter Reports</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Status</label>
          <select value={values.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
            <option value="">All</option>
            <option value="FINALIZED">Finalised</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">From</label>
          <input
            type="date"
            value={values.from}
            onChange={(e) => set("from", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">To</label>
          <input
            type="date"
            value={values.to}
            onChange={(e) => set("to", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Entered By</label>
          <input
            type="text"
            value={values.enteredBy}
            onChange={(e) => set("enteredBy", e.target.value)}
            placeholder="Name…"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Busy Level</label>
          <select value={values.busyLevel} onChange={(e) => set("busyLevel", e.target.value)} className={inputClass}>
            <option value="">All</option>
            <option value="QUIET">Quiet</option>
            <option value="MODERATE">Moderate</option>
            <option value="BUSY">Busy</option>
            <option value="VERY_BUSY">Very Busy</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Event Running</label>
          <select value={values.eventRunning} onChange={(e) => set("eventRunning", e.target.value)} className={inputClass}>
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={apply}>
          Apply Filters
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
