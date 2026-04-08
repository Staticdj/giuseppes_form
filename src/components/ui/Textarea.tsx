import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className = "", ...props }: TextareaProps) {
  return (
    <textarea
      rows={4}
      className={[
        "block w-full rounded-lg border px-3 py-2.5 text-base resize-y",
        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
        "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
        error
          ? "border-red-400 bg-red-50"
          : "border-gray-300 bg-white",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
