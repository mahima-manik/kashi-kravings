export default function MetricCard({
  label,
  value,
  warn,
  subtitle,
}: {
  label: string;
  value: string;
  warn?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p
        className={`font-semibold text-sm ${warn ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
