import React from "react";

interface StatusBadgeProps {
  status: "DRAFT" | "FINALIZED";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const classes =
    status === "FINALIZED"
      ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800"
      : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}
    >
      {status === "FINALIZED" ? "Finalised" : "Draft"}
    </span>
  );
}
