import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import api from "../api.js";
import StatCard from "../components/StatCard.jsx";
import PulseLine from "../components/PulseLine.jsx";

export default function AnalyticsDashboard() {
  const [topConditions, setTopConditions] = useState(null);
  const [keywords, setKeywords] = useState(null);
  const [volume, setVolume] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/analytics/top-conditions"),
      api.get("/analytics/symptom-keywords"),
      api.get("/analytics/query-volume"),
    ])
      .then(([tc, kw, vol]) => {
        setTopConditions(tc.data);
        setKeywords(kw.data);
        setVolume(vol.data);
      })
      .catch(() => setError("Couldn't load analytics right now."));
  }, []);

  const avgConfidence =
    topConditions && topConditions.conditions.length > 0
      ? (
          topConditions.conditions.reduce((s, c) => s + c.percentage, 0) /
          topConditions.conditions.length
        ).toFixed(1)
      : "—";

  if (error) {
    return <p className="font-body text-sm text-clay">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl text-ink mb-1">Analytics</h2>
        <p className="font-body text-sm text-ink/60">Aggregate view across all logged queries.</p>
        <PulseLine className="mt-3" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total queries" value={topConditions?.totalQueries ?? "…"} />
        <StatCard
          label="Top condition"
          value={topConditions?.conditions?.[0]?.condition ?? "—"}
        />
        <StatCard label="Avg. share" value={`${avgConfidence}%`} sub="of top-10 conditions" />
      </div>

      <section>
        <h3 className="font-display text-lg text-ink mb-3">Top predicted conditions</h3>
        <div className="border border-hairline bg-white/50 px-3 py-3" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topConditions?.conditions ?? []} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="condition"
                width={130}
                tick={{ fontFamily: "Inter", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, border: "1px solid #D7E0DC" }}
              />
              <Bar dataKey="count" fill="#2C6E6B" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="font-display text-lg text-ink mb-3">Top symptom keywords</h3>
        <div className="flex flex-wrap gap-2">
          {(keywords?.keywords ?? []).map((k) => (
            <span
              key={k.keyword}
              className="font-mono text-xs border border-hairline bg-sage/50 px-2.5 py-1 text-ink/80"
            >
              {k.keyword} <span className="text-teal-dark">×{k.count}</span>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display text-lg text-ink mb-3">Query volume over time</h3>
        <div className="border border-hairline bg-white/50 px-3 py-3" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volume?.buckets ?? []}>
              <CartesianGrid stroke="#D7E0DC" strokeDasharray="2 3" />
              <XAxis dataKey="period" tick={{ fontFamily: "IBM Plex Mono", fontSize: 10 }} />
              <YAxis tick={{ fontFamily: "IBM Plex Mono", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, border: "1px solid #D7E0DC" }}
              />
              <Line type="monotone" dataKey="count" stroke="#B8542F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
