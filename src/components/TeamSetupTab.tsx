import { useState, useEffect } from "react";
import { TeamSetup } from "../types";
import { Save, AlertTriangle } from "lucide-react";

export function TeamSetupTab({
  setup,
  onSave,
  totalPlayers,
  push,
}: {
  setup: TeamSetup | null;
  onSave: (s: TeamSetup) => Promise<void>;
  totalPlayers: number;
  push: (text: string, type?: "success" | "error" | "info") => void;
}) {
  const [teamCount, setTeamCount] = useState<number>(setup?.teamCount ?? 8);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(
    setup?.playersPerTeam ?? 7
  );
  const [teamNames, setTeamNames] = useState<string[]>(
    setup?.teamNames ?? []
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (setup) {
      setTeamCount(setup.teamCount);
      setPlayersPerTeam(setup.playersPerTeam);
      setTeamNames(setup.teamNames);
    }
  }, [setup]);

  useEffect(() => {
    setTeamNames((prev) => {
      const next = [...prev];
      if (next.length < teamCount) {
        for (let i = next.length; i < teamCount; i++) next.push("");
      } else if (next.length > teamCount) {
        next.length = teamCount;
      }
      return next;
    });
  }, [teamCount]);

  const required = teamCount * playersPerTeam;
  const mismatch = totalPlayers !== required;

  async function save() {
    if (teamCount < 1 || playersPerTeam < 1) {
      push("Team count and players per team must be at least 1", "error");
      return;
    }
    if (teamNames.some((n) => !n.trim())) {
      push("Team names cannot be empty", "error");
      return;
    }
    const names = teamNames.map((n) => n.trim());
    if (new Set(names).size !== names.length) {
      push("Team names must be unique", "error");
      return;
    }
    setBusy(true);
    try {
      await onSave({
        teamCount,
        playersPerTeam,
        teamNames: names,
      });
      if (mismatch) {
        push("Saved (warning: player count mismatch)", "info");
      } else {
        push("Team setup saved", "success");
      }
    } catch (e: any) {
      push(e.message || "Failed to save setup", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-4">
        <h2 className="font-bold text-slate-800">Team Setup</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Number of Teams
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={teamCount}
              onChange={(e) => setTeamCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Players per Team
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={playersPerTeam}
              onChange={(e) =>
                setPlayersPerTeam(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="bg-green-50 text-green-800 rounded-lg px-3 py-2 text-sm font-semibold">
          Total Players Required: {required}
          <span className="ml-2 text-xs font-normal text-green-700">
            ({teamCount} × {playersPerTeam})
          </span>
        </div>

        {mismatch && (
          <div className="flex items-start gap-2 bg-amber-50 text-amber-800 rounded-lg px-3 py-2 text-xs">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>
              Warning: You have {totalPlayers} players added but {required} are
              required. You can still save, but the shuffle step will need the
              counts to match.
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <h2 className="font-bold text-slate-800 mb-3">Team Names</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: teamCount }).map((_, i) => (
            <div key={i}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Team {i + 1} Name
              </label>
              <input
                value={teamNames[i] ?? ""}
                onChange={(e) => {
                  const next = [...teamNames];
                  next[i] = e.target.value;
                  setTeamNames(next);
                }}
                placeholder={`Team ${i + 1}`}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}
        </div>

        <button
          onClick={save}
          disabled={busy}
          className="mt-4 flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm"
        >
          <Save size={16} /> Save Team Setup
        </button>
      </div>
    </div>
  );
}
