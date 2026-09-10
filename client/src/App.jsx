import { Routes, Route, NavLink } from "react-router-dom";
import DiagnosePage from "./pages/DiagnosePage.jsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";

const navLinkClass = ({ isActive }) =>
  `font-mono text-xs tracking-wide uppercase pb-1 border-b-2 transition-colors ${
    isActive
      ? "border-teal text-ink"
      : "border-transparent text-ink/40 hover:text-ink/70"
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-paper font-body">
      <header className="border-b border-hairline">
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-4">
          <div className="flex items-baseline justify-between mb-6">
            <h1 className="font-display text-2xl text-ink tracking-tight">
              Med<span className="text-teal">Sense</span>
            </h1>
            <span className="font-mono text-[11px] text-ink/40">
              symptom insight tool
            </span>
          </div>
          <nav className="flex gap-6">
            <NavLink to="/" end className={navLinkClass}>
              Diagnose
            </NavLink>
            <NavLink to="/analytics" className={navLinkClass}>
              Analytics
            </NavLink>
            <NavLink to="/history" className={navLinkClass}>
              History
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<DiagnosePage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>

      <footer className="max-w-3xl mx-auto px-6 pb-8">
        <p className="font-mono text-[11px] text-ink/30">
          MedSense — educational portfolio project. Not for clinical use.
        </p>
      </footer>
    </div>
  );
}
