import { useEffect, useState } from "react";
import api from "../api.js";

export default function HistoryPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/history?page=${page}&limit=15`)
      .then((res) => setData(res.data))
      .catch(() => setError("Couldn't load query history right now."));
  }, [page]);

  if (error) return <p className="font-body text-sm text-clay">{error}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-ink mb-1">Query history</h2>
        <p className="font-body text-sm text-ink/60">
          {data ? `${data.total} logged queries` : "Loading…"}
        </p>
      </div>

      <div className="border border-hairline bg-white/50">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-hairline">
              <th className="font-mono text-[11px] uppercase text-ink/40 px-3 py-2">
                Timestamp
              </th>
              <th className="font-mono text-[11px] uppercase text-ink/40 px-3 py-2">
                Symptom text
              </th>
              <th className="font-mono text-[11px] uppercase text-ink/40 px-3 py-2">
                Top prediction
              </th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((item) => (
              <tr key={item._id} className="border-b border-hairline last:border-0">
                <td className="font-mono text-xs text-ink/60 px-3 py-2.5 whitespace-nowrap align-top">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
                <td className="font-body text-sm text-ink px-3 py-2.5 align-top">
                  {item.symptom_text}
                </td>
                <td className="font-mono text-xs text-teal-dark px-3 py-2.5 align-top whitespace-nowrap">
                  {item.top_condition}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={3} className="font-body text-sm text-ink/50 px-3 py-6 text-center">
                  No queries logged yet — try the Diagnose page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="font-mono text-xs uppercase text-ink/60 disabled:opacity-30"
          >
            ← Prev
          </button>
          <span className="font-mono text-xs text-ink/40">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="font-mono text-xs uppercase text-ink/60 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
