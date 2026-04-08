import React from "react";

type AlertType = "error" | "success" | "warning" | "info";

interface AlertProps {
  type: AlertType;
  message: string;
}

const classes: Record<AlertType, string> = {
  error: "bg-red-50 border-red-300 text-red-700",
  success: "bg-green-50 border-green-300 text-green-700",
  warning: "bg-yellow-50 border-yellow-300 text-yellow-700",
  info: "bg-blue-50 border-blue-300 text-blue-700",
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
