import React from "react";

interface StatusBadgeProps {
  status: "DRAFT" | "FINALIZED";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const classes =
    status === "FINALIZED"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}
    >
      {status === "FINALIZED" ? "Finalised" : "Draft"}
    </span>
  );
}
