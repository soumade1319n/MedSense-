export default function StatCard({ label, value, sub }) {
  return (
    <div className="border border-hairline bg-white/60 px-4 py-3">
      <p className="font-mono text-[11px] tracking-wide text-ink/50 uppercase mb-1">
        {label}
      </p>
      <p className="font-display text-3xl text-ink leading-none">{value}</p>
      {sub && <p className="font-body text-xs text-ink/50 mt-1">{sub}</p>}
    </div>
  );
}
