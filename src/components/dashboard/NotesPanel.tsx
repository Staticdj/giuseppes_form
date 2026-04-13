import type { NoteEntry } from "@/lib/dashboard/types";

interface Props {
  entries: NoteEntry[];
}

const busyColors: Record<string, string> = {
  QUIET: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  MODERATE: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400",
  BUSY: "bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400",
  VERY_BUSY: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
};

const weatherIcons: Record<string, string> = {
  FINE: "☀️",
  CLOUDY: "☁️",
  RAIN: "🌧️",
  STORM: "⛈️",
  HOT: "🌡️",
};

export function NotesPanel({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-giuseppe-card rounded-xl border border-gray-200 dark:border-giuseppe-border overflow-hidden mb-4">
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-giuseppe-darker border-b border-gray-200 dark:border-giuseppe-border">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Recent Notes & Operations
          </h3>
        </div>
        <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">
          No recent notes or operations.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-giuseppe-card rounded-xl border border-gray-200 dark:border-giuseppe-border overflow-hidden mb-4">
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-giuseppe-darker border-b border-gray-200 dark:border-giuseppe-border">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Recent Notes & Operations
        </h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-giuseppe-border">
        {entries.map((entry) => (
          <div key={entry.reportId} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {new Date(entry.date).toLocaleDateString("en-AU", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              {entry.busyLevel && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    busyColors[entry.busyLevel] ?? "bg-gray-100 dark:bg-giuseppe-border text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {entry.busyLevel.replace("_", " ")}
                </span>
              )}
              {entry.weatherCondition && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {weatherIcons[entry.weatherCondition] ?? ""}{" "}
                  {entry.weatherCondition}
                </span>
              )}
              {entry.eventRunning && entry.eventName && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-full">
                  {entry.eventName}
                </span>
              )}
            </div>
            {entry.notes && (
              <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
                &ldquo;{entry.notes}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
