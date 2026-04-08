import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  error,
  options,
  placeholder,
  className = "",
  ...props
}: SelectProps) {
  return (
    <select
      className={[
        "block w-full rounded-lg border px-3 py-2.5 text-base bg-white",
        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
        "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
        error ? "border-red-400 bg-red-50" : "border-gray-300",
        className,
      ].join(" ")}
      {...props}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
