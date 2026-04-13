import React from "react";

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: boolean;
  prefix?: string;
}

export function CurrencyInput({
  error,
  prefix = "$",
  className = "",
  ...props
}: CurrencyInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base select-none">
        {prefix}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        className={[
          "block w-full rounded-lg border pl-8 pr-3 py-2.5 text-base",
          "bg-white dark:bg-giuseppe-card",
          "text-gray-900 dark:text-giuseppe-cream",
          "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600",
          "disabled:bg-gray-50 dark:disabled:bg-giuseppe-darker disabled:text-gray-500 disabled:cursor-not-allowed",
          error
            ? "border-red-400 bg-red-50 dark:bg-red-950/30"
            : "border-gray-300 dark:border-giuseppe-border",
          className,
        ].join(" ")}
        {...props}
      />
    </div>
  );
}
