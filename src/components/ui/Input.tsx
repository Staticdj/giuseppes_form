import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className = "", ...props }: InputProps) {
  return (
    <input
      className={[
        "block w-full rounded-lg border px-3 py-2.5 text-base",
        "bg-white dark:bg-giuseppe-card",
        "text-gray-900 dark:text-giuseppe-cream",
        "placeholder-gray-400 dark:placeholder-gray-500",
        "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600",
        "disabled:bg-gray-50 dark:disabled:bg-giuseppe-darker disabled:text-gray-500 disabled:cursor-not-allowed",
        error
          ? "border-red-400 bg-red-50 dark:bg-red-950/30"
          : "border-gray-300 dark:border-giuseppe-border",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
