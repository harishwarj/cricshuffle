import { useState } from "react";
import { Player, TeamSetup, TeamResult } from "../types";
import { Dices, Check, Star, Crown, ChevronDown, Shield } from "lucide-react";

export function ShuffleTab({
  players,
  setup,
  selected,
  setSelected,
  captains,
  setCaptains,
  viceCaptains,
  setViceCaptains,
  onShuffle,
  goToResults,
  push,
}: {
  players: Player[];
  setup: TeamSetup | null;
  selected: string[];
  setSelected: (s: string[]) => void;
  // captains[i] = player id assigned as captain for setup.teamNames[i]
  captains: string[];
  setCaptains: (s: string[]) => void;
  // viceCaptains[i] = player id assigned as vice captain for setup.teamNames[i]
  viceCaptains: string[];
  setViceCaptains: (s: string[]) => void;
  onShuffle: (teams: TeamResult[]) => Promise<void>;
  goToResults: () => void;
  push: (text: string, type?: "success" | "error" | "info") => void;
}) {
  const requiredPlayers = setup ? setup.teamCount * setup.playersPerTeam : 0;
  const [busy, setBusy] = useState(false);

  // ── Step A: toggle player selection ──────────────────────────────────────
  function toggleSelect(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
      // also clear this player from any captain / vice captain slot
      setCaptains(captains.map((c) => (c === id ? "" : c)));
      setViceCaptains(viceCaptains.map((c) => (c === id ? "" : c)));
    } else {
      if (selected.length >= requiredPlayers) {
        push(`You can only select ${requiredPlayers} players`, "error");
        return;
      }
      setSelected([...selected, id]);
    }
  }

  // ── Step B: assign captain to a specific team slot ───────────────────────
  function setCaptainForTeam(teamIndex: number, playerId: string) {
    const next = [...captains];
    // If another team already has this player as captain, clear that slot first
    next.forEach((c, i) => {
      if (c === playerId && i !== teamIndex) next[i] = "";
    });
    next[teamIndex] = playerId;
    // If this player was vice captain for the same team, clear it
    const nextVC = [...viceCaptains];
    if (nextVC[teamIndex] === playerId) nextVC[teamIndex] = "";
    setCaptains(next);
    setViceCaptains(nextVC);
  }

  // ── Step B2: assign vice captain to a specific team slot ─────────────────
  function setViceCaptainForTeam(teamIndex: number, playerId: string) {
    const next = [...viceCaptains];
    // If another team already has this player as vice captain, clear that slot
    next.forEach((c, i) => {
      if (c === playerId && i !== teamIndex) next[i] = "";
    });
    next[teamIndex] = playerId;
    // If this player was captain for the same team, clear captain
    const nextC = [...captains];
    if (nextC[teamIndex] === playerId) nextC[teamIndex] = "";
    setViceCaptains(next);
    setCaptains(nextC);
  }

  async function shuffle() {
    if (!setup) return;
    if (selected.length !== requiredPlayers) {
      push(`Select exactly ${requiredPlayers} players`, "error");
      return;
    }
    // Validate all captains assigned
    const missingCaptain = setup.teamNames.findIndex((_, i) => !captains[i]);
    if (missingCaptain !== -1) {
      push(
        `Please assign a captain for "${setup.teamNames[missingCaptain]}"`,
        "error"
      );
      return;
    }
    // Validate all vice captains assigned
    const missingVC = setup.teamNames.findIndex((_, i) => !viceCaptains[i]);
    if (missingVC !== -1) {
      push(
        `Please assign a vice captain for "${setup.teamNames[missingVC]}"`,
        "error"
      );
      return;
    }
    // Validate captains and vice captains are in the selected pool
    for (let i = 0; i < setup.teamCount; i++) {
      if (!selected.includes(captains[i])) {
        const name = players.find((p) => p.id === captains[i])?.name ?? captains[i];
        push(`Captain "${name}" must be selected in Step A`, "error");
        return;
      }
      if (!selected.includes(viceCaptains[i])) {
        const name = players.find((p) => p.id === viceCaptains[i])?.name ?? viceCaptains[i];
        push(`Vice Captain "${name}" must be selected in Step A`, "error");
        return;
      }
    }
    setBusy(true);
    try {
      await onShuffle([]);
      goToResults();
    } catch (e: any) {
      push(e.message || "Shuffle failed", "error");
    } finally {
      setBusy(false);
    }
  }

  if (!setup) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center text-slate-500 text-sm">
        Please save a Team Setup first.
      </div>
    );
  }

  const playersReady = selected.length === requiredPlayers;
  const captainsReady =
    setup.teamNames.every((_, i) => !!captains[i]) &&
    captains.slice(0, setup.teamCount).every((c) => selected.includes(c));
  const viceCaptainsReady =
    setup.teamNames.every((_, i) => !!viceCaptains[i]) &&
    viceCaptains.slice(0, setup.teamCount).every((c) => selected.includes(c));
  const canShuffle = playersReady && captainsReady && viceCaptainsReady && !busy;

  // Players available to be selected as captains/vice captains (must be in selected pool)
  const selectedPlayers = players.filter((p) => selected.includes(p.id));

  return (
    <div className="space-y-5">
      {/* Step A */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">
            Step A — Select Players for Tournament
          </h2>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              playersReady
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Selected: {selected.length} / {requiredPlayers}
          </span>
        </div>
        {players.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            No players available. Add players in the Manage Players tab.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
            {players.map((p) => {
              const isSel = selected.includes(p.id);
              const disabled = !isSel && selected.length >= requiredPlayers;
              return (
                <button
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  disabled={disabled}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition text-left ${
                    isSel
                      ? "bg-green-50 border-green-400 text-green-800"
                      : disabled
                      ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-white border-slate-200 hover:border-green-300 text-slate-700"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5 text-orange-500">
                      {Array.from({ length: p.stars }).map((_, i) => (
                        <Star key={i} size={11} fill="currentColor" />
                      ))}
                    </span>
                    {isSel && <Check size={14} className="text-green-600" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Step B — Per-team captain assignment */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">
            Step B — Assign Captains to Teams
          </h2>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              captainsReady
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {captains.filter((c, i) => i < setup.teamCount && !!c && selected.includes(c)).length} / {setup.teamCount} assigned
          </span>
        </div>
        {selected.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            Select players in Step A first.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {setup.teamNames.map((teamName, i) => {
              const assignedId = captains[i] ?? "";
              const assignedPlayer = players.find((p) => p.id === assignedId);
              return (
                <div key={i} className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Crown size={12} className="text-orange-500" />
                    {teamName || `Team ${i + 1}`}
                  </label>
                  <div className="relative">
                    <select
                      value={assignedId}
                      onChange={(e) => setCaptainForTeam(i, e.target.value)}
                      className={`w-full appearance-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-8 ${
                        assignedId && selected.includes(assignedId)
                          ? "bg-orange-50 border-orange-400 text-orange-800 font-semibold"
                          : "bg-white border-slate-300 text-slate-700"
                      }`}
                    >
                      <option value="">— Pick captain —</option>
                      {selectedPlayers.map((p) => {
                        // Disabled if used as captain by another team OR as vice captain for this team
                        const usedAsCapByOther = captains.some(
                          (c, j) => j !== i && c === p.id
                        );
                        const usedAsVCHere = viceCaptains[i] === p.id;
                        const disabled = usedAsCapByOther || usedAsVCHere;
                        return (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={disabled}
                          >
                            {p.name} {"⭐".repeat(p.stars)}{usedAsCapByOther ? " (captain elsewhere)" : usedAsVCHere ? " (VC this team)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                  {assignedPlayer && (
                    <p className="text-[11px] text-orange-600 font-medium flex items-center gap-1">
                      <Crown size={10} /> {assignedPlayer.name} is captain
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step B2 — Per-team vice captain assignment */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">
            Step B2 — Assign Vice Captains to Teams
          </h2>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              viceCaptainsReady
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {viceCaptains.filter((c, i) => i < setup.teamCount && !!c && selected.includes(c)).length} / {setup.teamCount} assigned
          </span>
        </div>
        {selected.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            Select players in Step A first.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {setup.teamNames.map((teamName, i) => {
              const assignedId = viceCaptains[i] ?? "";
              const assignedPlayer = players.find((p) => p.id === assignedId);
              return (
                <div key={i} className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Shield size={12} className="text-blue-500" />
                    {teamName || `Team ${i + 1}`}
                  </label>
                  <div className="relative">
                    <select
                      value={assignedId}
                      onChange={(e) => setViceCaptainForTeam(i, e.target.value)}
                      className={`w-full appearance-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-8 ${
                        assignedId && selected.includes(assignedId)
                          ? "bg-blue-50 border-blue-400 text-blue-800 font-semibold"
                          : "bg-white border-slate-300 text-slate-700"
                      }`}
                    >
                      <option value="">— Pick vice captain —</option>
                      {selectedPlayers.map((p) => {
                        // Disabled if captain for this team, or VC for another team, or captain for another team
                        const isCapHere = captains[i] === p.id;
                        const usedAsVCByOther = viceCaptains.some(
                          (c, j) => j !== i && c === p.id
                        );
                        const usedAsCapByOther = captains.some(
                          (c, j) => j !== i && c === p.id
                        );
                        const disabled = isCapHere || usedAsVCByOther || usedAsCapByOther;
                        return (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={disabled}
                          >
                            {p.name} {"⭐".repeat(p.stars)}{isCapHere ? " (captain this team)" : usedAsVCByOther ? " (VC elsewhere)" : usedAsCapByOther ? " (captain elsewhere)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                  {assignedPlayer && (
                    <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                      <Shield size={10} /> {assignedPlayer.name} is vice captain
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step C */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <h2 className="font-bold text-slate-800 mb-3">Step C — Shuffle</h2>
        <button
          onClick={shuffle}
          disabled={!canShuffle}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition ${
            canShuffle
              ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md"
              : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          <Dices size={20} /> Shuffle & Create Teams
        </button>
        {!canShuffle && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            Select exactly {requiredPlayers} players and assign all{" "}
            {setup.teamCount} captains and vice captains to enable shuffle.
          </p>
        )}
      </div>
    </div>
  );
}
