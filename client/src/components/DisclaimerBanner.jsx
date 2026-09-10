export default function DisclaimerBanner() {
  return (
    <div className="border border-hairline bg-sage/60 px-4 py-2.5 text-sm text-ink/80 font-body flex items-start gap-2">
      <span className="font-mono text-[11px] tracking-wide text-teal-dark mt-0.5 shrink-0">
        NOTE
      </span>
      <p>
        MedSense is an educational triage-style assistant, not a medical diagnostic tool.
        Predictions are illustrative only — please consult a healthcare professional for
        medical advice.
      </p>
    </div>
  );
}
