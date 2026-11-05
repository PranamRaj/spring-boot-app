export function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>;
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function ProgressBar({ value, max, over }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-brand-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export const label = (s) => s.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
