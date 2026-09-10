import { useState } from "react";
import api from "../api.js";
import PulseLine from "../components/PulseLine.jsx";
import DisclaimerBanner from "../components/DisclaimerBanner.jsx";
import ConfidenceBar from "../components/ConfidenceBar.jsx";

export default function DiagnosePage() {
  const [symptomText, setSymptomText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const text = symptomText.trim();
    if (text.length < 3) {
      setError("Describe your symptoms in a bit more detail before submitting.");
      return;
    }

    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const { data } = await api.post("/diagnose", { symptom_text: text });
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(
        err.response?.data?.error || "Something went wrong reaching the prediction service."
      );
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <section>
        <h2 className="font-display text-xl text-ink mb-1">Describe your symptoms</h2>
        <p className="font-body text-sm text-ink/60 mb-4">
          Plain language is fine — e.g. "splitting headache, nausea, light sensitivity for
          2 days".
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
            rows={4}
            placeholder="What are you experiencing?"
            className="w-full border border-hairline bg-white/70 px-3 py-2.5 font-body text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-ink/40">
              {symptomText.length}/2000
            </span>
            <button
              type="submit"
              disabled={status === "loading"}
              className="font-mono text-xs uppercase tracking-wide bg-teal text-white px-5 py-2 hover:bg-teal-dark transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Analyzing…" : "Submit"}
            </button>
          </div>
        </form>
      </section>

      {status === "loading" && (
        <div className="pt-2">
          <PulseLine animated />
          <p className="font-mono text-[11px] text-ink/40 text-center mt-1">
            running inference…
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="border border-clay/40 bg-clay/5 px-4 py-3">
          <p className="font-body text-sm text-clay">{error}</p>
        </div>
      )}

      {status === "done" && result && (
        <section className="border border-hairline bg-white/50 px-5 py-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-lg text-ink">Likely conditions</h3>
            <span className="font-mono text-[11px] text-ink/40">top {result.predictions.length}</span>
          </div>
          <PulseLine className="mb-2" />
          {result.predictions.map((p, i) => (
            <ConfidenceBar
              key={p.condition}
              rank={i}
              condition={p.condition}
              confidence={p.confidence}
            />
          ))}
        </section>
      )}
    </div>
  );
}
