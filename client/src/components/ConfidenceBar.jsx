/**
 * Renders a single prediction as a labeled gauge — condition name, a tick-marked
 * bar, and the confidence value in monospace (instrument-readout feel).
 */
export default function ConfidenceBar({ rank, condition, confidence }) {
  const pct = Math.round(confidence * 1000) / 10; // one decimal
  const isTop = rank === 0;

  return (
    <div className="py-3 border-b border-hairline last:border-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-display text-lg text-ink">
          <span className="font-mono text-xs text-ink/40 mr-2">0{rank + 1}</span>
          {condition}
        </span>
        <span className="font-mono text-sm text-teal-dark">{pct.toFixed(1)}%</span>
      </div>
      <div className="relative h-2 bg-hairline/70 overflow-hidden">
        <div
          className={`h-full ${isTop ? "bg-clay" : "bg-teal"}`}
          style={{ width: `${pct}%` }}
        />
        {/* tick marks every 10% */}
        <div className="absolute inset-0 flex justify-between pointer-events-none">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="w-px bg-paper/70 h-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
