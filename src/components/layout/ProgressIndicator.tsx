"use client";

export interface FormStep {
  id: number;
  label: string;
  shortLabel: string;
}

export const FORM_STEPS: FormStep[] = [
  { id: 1, label: "Report Info", shortLabel: "Info" },
  { id: 2, label: "Financial Totals", shortLabel: "Financials" },
  { id: 3, label: "Sales Channels", shortLabel: "Sales" },
  { id: 4, label: "Staffing", shortLabel: "Staff" },
  { id: 5, label: "Adjustments & Notes", shortLabel: "Notes" },
  { id: 6, label: "Smart Additions", shortLabel: "Extras" },
  { id: 7, label: "Sign-Off", shortLabel: "Sign-Off" },
  { id: 8, label: "Finalise", shortLabel: "Finalise" },
];

interface ProgressIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function ProgressIndicator({
  currentStep,
  onStepClick,
}: ProgressIndicatorProps) {
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-center gap-1 min-w-max mx-auto px-2">
        {FORM_STEPS.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <div key={step.id} className="flex items-center">
              {/* Step bubble */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={[
                  "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors",
                  isClickable
                    ? "cursor-pointer hover:bg-brand-50 dark:hover:bg-giuseppe-border"
                    : "cursor-default",
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    isCompleted
                      ? "bg-brand-600 text-white"
                      : isCurrent
                      ? "bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 border-2 border-brand-600"
                      : "bg-gray-100 dark:bg-giuseppe-border text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-giuseppe-border",
                  ].join(" ")}
                >
                  {isCompleted ? "✓" : step.id}
                </span>
                <span
                  className={[
                    "text-xs leading-tight text-center whitespace-nowrap",
                    isCurrent
                      ? "text-brand-600 dark:text-brand-400 font-medium"
                      : "text-gray-500 dark:text-gray-400",
                  ].join(" ")}
                >
                  {step.shortLabel}
                </span>
              </button>

              {/* Connector line */}
              {idx < FORM_STEPS.length - 1 && (
                <div
                  className={[
                    "h-0.5 w-4 mx-0.5 flex-shrink-0",
                    isCompleted
                      ? "bg-brand-400"
                      : "bg-gray-200 dark:bg-giuseppe-border",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
