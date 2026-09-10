/**
 * Signature element: an ECG-style pulse line used as a section divider.
 * `animated` draws it continuously (used while the model is "thinking").
 * When not animated, it renders as a static hairline motif.
 */
export default function PulseLine({ animated = false, className = "" }) {
  return (
    <svg
      viewBox="0 0 400 40"
      className={`w-full h-8 ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 20 H140 L155 6 L170 34 L185 20 H400"
        fill="none"
        stroke="#2C6E6B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? "pulse-line-path" : ""}
        opacity={animated ? 1 : 0.35}
      />
    </svg>
  );
}
