import { TeamResult } from "../types";
import { Star, Crown, Printer } from "lucide-react";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5 text-orange-500">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={13} fill="currentColor" />
      ))}
    </span>
  );
}

export function FinalTeams({
  teams,
  push,
}: {
  teams: TeamResult[];
  push: (text: string, type?: "success" | "error" | "info") => void;
}) {
  if (!teams || teams.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center text-slate-500 text-sm">
        No teams generated yet. Go to the Shuffle tab to create teams.
      </div>
    );
  }

  function print() {
    push("Opening print dialog…", "info");
    setTimeout(() => window.print(), 100);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <h2 className="font-bold text-slate-800 text-lg">Final Teams</h2>
        <button
          onClick={print}
          className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold px-3.5 py-2 rounded-lg text-sm"
        >
          <Printer size={15} /> Print Teams
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 print-page">
        {teams.map((t, i) => {
          const counts = { 5: 0, 4: 0, 3: 0 };
          for (const p of t.players) counts[p.stars]++;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pop"
            >
              <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 py-2.5">
                <h3 className="font-bold text-base">{t.name}</h3>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2 mb-2">
                  <span className="flex items-center gap-1.5 font-semibold text-orange-800 text-sm">
                    <Crown size={15} /> {t.captain.name}
                  </span>
                  <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                    Captain
                  </span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {t.players.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between py-1.5 text-sm text-slate-700"
                    >
                      <span className="truncate">{p.name}</span>
                      <Stars n={p.stars} />
                    </li>
                  ))}
                </ul>
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
                  ⭐5: {counts[5]} | ⭐4: {counts[4]} | ⭐3: {counts[3]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
