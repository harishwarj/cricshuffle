import { useState } from "react";
import { Player, TeamResult } from "../types";
import { Star, Crown, Shield, Printer, ArrowLeftRight, Check, X } from "lucide-react";

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
  allPlayers,
  onReplacePlayer,
  push,
}: {
  teams: TeamResult[];
  allPlayers: Player[];
  onReplacePlayer: (teamIdx: number, oldPlayerId: string, newPlayer: Player) => Promise<void>;
  push: (text: string, type?: "success" | "error" | "info") => void;
}) {
  // Track which player slot is in "replace" mode: { teamIdx, playerId }
  const [replacing, setReplacing] = useState<{ teamIdx: number; playerId: string } | null>(null);
  const [replaceBusy, setReplaceBusy] = useState(false);

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

  // All player IDs currently assigned across ALL teams (captain, VC, or player)
  const assignedIds = new Set<string>([
    ...teams.flatMap((t) => [
      t.captain.id,
      t.viceCaptain.id,
      ...t.players.map((p) => p.id),
    ]),
  ]);

  // Players available for replacement = full DB minus already-assigned
  const availableForReplacement = allPlayers.filter((p) => !assignedIds.has(p.id));

  async function handleReplace(newPlayerId: string) {
    if (!replacing) return;
    const newPlayer = allPlayers.find((p) => p.id === newPlayerId);
    if (!newPlayer) return;
    setReplaceBusy(true);
    try {
      await onReplacePlayer(replacing.teamIdx, replacing.playerId, newPlayer);
      push(`Replaced with ${newPlayer.name}`, "success");
      setReplacing(null);
    } catch (e: any) {
      push(e.message || "Replace failed", "error");
    } finally {
      setReplaceBusy(false);
    }
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

      {replacing && (
        <div className="no-print bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-indigo-800">
              Select a replacement player:
            </p>
            <button
              onClick={() => setReplacing(null)}
              className="text-slate-500 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>
          {availableForReplacement.length === 0 ? (
            <p className="text-sm text-slate-500">No available players to replace with.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
              {availableForReplacement.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleReplace(p.id)}
                  disabled={replaceBusy}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-100 text-sm text-slate-700 transition disabled:opacity-50"
                >
                  <span className="truncate font-medium">{p.name}</span>
                  <Stars n={p.stars} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 print-page">
        {teams.map((t, teamIdx) => {
          const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0 };
          for (const p of t.players) counts[p.stars] = (counts[p.stars] ?? 0) + 1;
          return (
            <div
              key={teamIdx}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pop"
            >
              <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 py-2.5">
                <h3 className="font-bold text-base">{t.name}</h3>
              </div>
              <div className="p-3">
                {/* Captain */}
                <div className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2 mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-orange-800 text-sm">
                    <Crown size={15} /> {t.captain.name}
                  </span>
                  <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                    Captain
                  </span>
                </div>
                {/* Vice Captain */}
                <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 mb-2">
                  <span className="flex items-center gap-1.5 font-semibold text-blue-800 text-sm">
                    <Shield size={15} /> {t.viceCaptain.name}
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    Vice Captain
                  </span>
                </div>
                {/* Players with replace buttons */}
                <ul className="divide-y divide-slate-100">
                  {t.players.map((p) => {
                    const isReplacing =
                      replacing?.teamIdx === teamIdx && replacing?.playerId === p.id;
                    return (
                      <li
                        key={p.id}
                        className={`flex items-center justify-between py-1.5 text-sm ${
                          isReplacing ? "bg-indigo-50 rounded-lg px-1" : ""
                        }`}
                      >
                        <span className="truncate text-slate-700">{p.name}</span>
                        <span className="flex items-center gap-2 flex-shrink-0">
                          <Stars n={p.stars} />
                          <button
                            onClick={() =>
                              isReplacing
                                ? setReplacing(null)
                                : setReplacing({ teamIdx, playerId: p.id })
                            }
                            className={`no-print p-1 rounded-md transition ${
                              isReplacing
                                ? "bg-indigo-200 text-indigo-700"
                                : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            }`}
                            title={isReplacing ? "Cancel replace" : "Replace player"}
                          >
                            {isReplacing ? <Check size={13} /> : <ArrowLeftRight size={13} />}
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
                  ⭐5: {counts[5]} | ⭐4: {counts[4]} | ⭐3: {counts[3]} | ⭐2: {counts[2]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
