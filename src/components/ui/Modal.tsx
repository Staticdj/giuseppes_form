"use client";

import React, { useEffect } from "react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative bg-white dark:bg-giuseppe-card rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-giuseppe-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-giuseppe-cream">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-4 text-gray-700 dark:text-gray-300">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-giuseppe-border flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
