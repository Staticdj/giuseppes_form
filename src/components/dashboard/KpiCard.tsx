interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export function KpiCard({ label, value, sub, accent = false }: KpiCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-1 ${
        accent
          ? "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800"
          : "bg-white dark:bg-giuseppe-card border-gray-200 dark:border-giuseppe-border"
      }`}
    >
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-2xl font-bold leading-tight ${
          accent
            ? "text-brand-700 dark:text-brand-400"
            : "text-gray-900 dark:text-giuseppe-cream"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}
