import React from "react";

type AlertType = "error" | "success" | "warning" | "info";

interface AlertProps {
  type: AlertType;
  message: string;
}

const classes: Record<AlertType, string> = {
  error: "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400",
  success: "bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400",
  warning: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400",
  info: "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400",
};

const icons: Record<AlertType, string> = {
  error: "⚠",
  success: "✓",
  warning: "⚠",
  info: "ℹ",
};

export function Alert({ type, message }: AlertProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${classes[type]}`}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}
