import { useState } from "react";
import { Player, TeamSetup, TeamResult, ShuffleMode, SpecialAssignment } from "../types";
import {
  Dices,
  Check,
  Star,
  Crown,
  ChevronDown,
  Shield,
  Shuffle,
  Zap,
  Lock,
  ChevronRight,
} from "lucide-react";
import { fisherYates } from "../shuffle";

// ── Helpers ──────────────────────────────────────────────────────────────────

function StarsRow({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5 text-orange-400">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={10} fill="currentColor" />
      ))}
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoundAssignment {
  teamIndex: number;
  teamName: string;
  player: Player;
}

// ── Component ─────────────────────────────────────────────────────────────────

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
  special,
}: {
  players: Player[];
  setup: TeamSetup | null;
  selected: string[];
  setSelected: (s: string[]) => void;
  captains: string[];
  setCaptains: (s: string[]) => void;
  viceCaptains: string[];
  setViceCaptains: (s: string[]) => void;
  onShuffle: (teams?: TeamResult[]) => Promise<void>;
  goToResults: () => void;
  push: (text: string, type?: "success" | "error" | "info") => void;
  special: SpecialAssignment | null;
}) {
  const requiredPlayers = setup ? setup.teamCount * setup.playersPerTeam : 0;
  const [busy, setBusy] = useState(false);
  const [shuffleMode, setShuffleMode] = useState<ShuffleMode>("full");

  // ── Single shuffle state ────────────────────────────────────────────────────
  const [completedRounds, setCompletedRounds] = useState<RoundAssignment[][]>([]);
  const [currentRoundPicks, setCurrentRoundPicks] = useState<string[]>([]);

  // ── Step A helpers ──────────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
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

  // ── Captain / VC helpers ────────────────────────────────────────────────────
  function setCaptainForTeam(teamIndex: number, playerId: string) {
    const next = [...captains];
    next.forEach((c, i) => { if (c === playerId && i !== teamIndex) next[i] = ""; });
    next[teamIndex] = playerId;
    const nextVC = [...viceCaptains];
    if (nextVC[teamIndex] === playerId) nextVC[teamIndex] = "";
    setCaptains(next);
    setViceCaptains(nextVC);
  }

  function setViceCaptainForTeam(teamIndex: number, playerId: string) {
    const next = [...viceCaptains];
    next.forEach((c, i) => { if (c === playerId && i !== teamIndex) next[i] = ""; });
    next[teamIndex] = playerId;
    const nextC = [...captains];
    if (nextC[teamIndex] === playerId) nextC[teamIndex] = "";
    setViceCaptains(next);
    setCaptains(nextC);
  }

  // ── Compute pool (excluding captains + VCs + already-placed in rounds) ──────
  function getBasePool() {
    if (!setup) return [];
    const captainIds = new Set(captains.slice(0, setup.teamCount).filter(Boolean));
    const vcIds = new Set(viceCaptains.slice(0, setup.teamCount).filter(Boolean));
    return players.filter(
      (p) => selected.includes(p.id) && !captainIds.has(p.id) && !vcIds.has(p.id)
    );
  }

  function getAlreadyPlacedInRounds() {
    return new Set(completedRounds.flat().map((r) => r.player.id));
  }

  // Pre-placed forced players (special assignment) for single shuffle mode
  function getForcedPlayers(basePool: Player[]): Player[] {
    if (!special?.enabled || !special.forcedCaptainName || !setup) return [];
    const harishwarIdx = setup.teamNames.findIndex(
      (n) => n.toLowerCase() === special.forcedCaptainName.toLowerCase()
    );
    if (harishwarIdx === -1) return [];
    // Only force players if the harishwar captain is actually assigned
    const harishwarCapId = captains[harishwarIdx];
    if (!harishwarCapId) return [];
    return (special.forcedPlayerNames ?? [])
      .map((name) => basePool.find((p) => p.name.toLowerCase() === name.toLowerCase()))
      .filter((p): p is Player => !!p);
  }

  // ── Full shuffle ────────────────────────────────────────────────────────────
  async function runFullShuffle() {
    if (!setup) return;
    if (selected.length !== requiredPlayers) {
      push(`Select exactly ${requiredPlayers} players`, "error");
      return;
    }
    const missingCaptain = setup.teamNames.findIndex((_, i) => !captains[i]);
    if (missingCaptain !== -1) {
      push(`Please assign a captain for "${setup.teamNames[missingCaptain]}"`, "error");
      return;
    }
    const missingVC = setup.teamNames.findIndex((_, i) => !viceCaptains[i]);
    if (missingVC !== -1) {
      push(`Please assign a vice captain for "${setup.teamNames[missingVC]}"`, "error");
      return;
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

  // ── Single shuffle: round logic ─────────────────────────────────────────────
  const totalExtraSlots = setup ? setup.playersPerTeam - 2 : 0; // slots beyond captain + VC
  const teamCount = setup?.teamCount ?? 0;

  const basePool = getBasePool();
  const alreadyPlaced = getAlreadyPlacedInRounds();
  const forcedPlayers = getForcedPlayers(basePool);
  const forcedIds = new Set(forcedPlayers.map((p) => p.id));

  // Players available for manual round selection (not forced, not already placed)
  const availablePool = basePool.filter(
    (p) => !alreadyPlaced.has(p.id) && !forcedIds.has(p.id)
  );

  // Figure out how many rounds are "auto" (forced) vs manual
  // Forced players fill Harishwar's team slots first, each takes one slot in that team only
  // We count how many extra slots are taken by forced players in Harishwar's team
  const harishwarIdx = setup
    ? setup.teamNames.findIndex(
        (n) => special?.enabled && n.toLowerCase() === special.forcedCaptainName?.toLowerCase()
      )
    : -1;

  // Completed rounds from the forced pre-assignment (shown as locked rounds)
  const forcedRounds: RoundAssignment[] = completedRounds.length === 0
    ? forcedPlayers.map((p) => ({
        teamIndex: harishwarIdx,
        teamName: setup?.teamNames[harishwarIdx] ?? "",
        player: p,
      }))
    : [];

  // Total rounds needed: totalExtraSlots
  // Rounds that are "auto" = number of forced players (they each fill one slot for harishwarIdx)
  const autoRoundCount = harishwarIdx !== -1 && completedRounds.length === 0 ? forcedPlayers.length : 0;
  const manualRoundsCompleted = completedRounds.length;
  const currentRoundNumber = manualRoundsCompleted + 1; // 1-indexed
  const allManualRoundsDone = manualRoundsCompleted >= totalExtraSlots;

  function toggleRoundPick(id: string) {
    if (currentRoundPicks.includes(id)) {
      setCurrentRoundPicks(currentRoundPicks.filter((x) => x !== id));
    } else {
      if (currentRoundPicks.length >= teamCount) {
        push(`Select exactly ${teamCount} players for this round`, "error");
        return;
      }
      setCurrentRoundPicks([...currentRoundPicks, id]);
    }
  }

  function shuffleCurrentRound() {
    if (!setup) return;
    if (currentRoundPicks.length !== teamCount) {
      push(`Select exactly ${teamCount} players for this round`, "error");
      return;
    }

    const pickedPlayers = currentRoundPicks
      .map((id) => players.find((p) => p.id === id)!)
      .filter(Boolean);

    // Fisher-Yates shuffle the picks, then assign one per team
    const shuffled = fisherYates(pickedPlayers);

    // Build the assignments: shuffled[i] → team[i]
    const assignments: RoundAssignment[] = shuffled.map((player, i) => ({
      teamIndex: i,
      teamName: setup.teamNames[i],
      player,
    }));

    setCompletedRounds([...completedRounds, assignments]);
    setCurrentRoundPicks([]);
  }

  async function finalizeSingleShuffle() {
    if (!setup) return;
    if (!allManualRoundsDone) {
      push("Complete all shuffle rounds first", "error");
      return;
    }

    setBusy(true);
    try {
      // Build teams from captains, VCs, and rounds
      const teams: TeamResult[] = setup.teamNames.map((name, teamIdx) => {
        const captain = players.find((p) => p.id === captains[teamIdx])!;
        const viceCaptain = players.find((p) => p.id === viceCaptains[teamIdx])!;

        // Collect players assigned to this team across all rounds
        const teamPlayers = completedRounds
          .flatMap((round) => round)
          .filter((a) => a.teamIndex === teamIdx)
          .map((a) => a.player);

        // Also include forced players for harishwar's team
        let extraPlayers: Player[] = [];
        if (teamIdx === harishwarIdx) {
          extraPlayers = forcedPlayers.filter(
            (fp) => !teamPlayers.some((tp) => tp.id === fp.id)
          );
        }

        return { name, captain, viceCaptain, players: [...extraPlayers, ...teamPlayers] };
      });

      await onShuffle(teams);
      goToResults();
    } catch (e: any) {
      push(e.message || "Failed to finalize teams", "error");
    } finally {
      setBusy(false);
    }
  }

  function resetSingleShuffle() {
    setCompletedRounds([]);
    setCurrentRoundPicks([]);
  }

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (!setup) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center text-slate-500 text-sm">
        Please save a Team Setup first.
      </div>
    );
  }

  const playersReady = selected.length === requiredPlayers;
  const captainsReady =
    captains.slice(0, setup.teamCount).length === setup.teamCount &&
    captains.slice(0, setup.teamCount).every((c) => !!c && selected.includes(c));
  const viceCaptainsReady =
    viceCaptains.slice(0, setup.teamCount).length === setup.teamCount &&
    viceCaptains.slice(0, setup.teamCount).every((c) => !!c && selected.includes(c));
  const canFullShuffle = playersReady && captainsReady && viceCaptainsReady && !busy;
  const canStartSingleRounds = playersReady && captainsReady && viceCaptainsReady;

  const selectedPlayers = players.filter((p) => selected.includes(p.id));

  return (
    <div className="space-y-5">

      {/* ── Mode Toggle ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-800">Shuffle Mode</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {shuffleMode === "full"
                ? "Remaining 5 players are randomly distributed across all teams at once"
                : "Assign one player per team each round — full control over the process"}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => { setShuffleMode("full"); resetSingleShuffle(); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                shuffleMode === "full"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Zap size={14} /> Full Shuffle
            </button>
            <button
              onClick={() => { setShuffleMode("single"); resetSingleShuffle(); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                shuffleMode === "single"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Shuffle size={14} /> Single Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* ── Step A: Select Players ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Step A — Select Players for Tournament</h2>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              playersReady ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {selected.length} / {requiredPlayers}
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
                    <StarsRow n={p.stars} />
                    {isSel && <Check size={14} className="text-green-600" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Step B: Captains ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Step B — Assign Captains to Teams</h2>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              captainsReady ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {captains.filter((c, i) => i < setup.teamCount && !!c && selected.includes(c)).length} / {setup.teamCount}
          </span>
        </div>
        {selected.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Select players in Step A first.</p>
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
                        const usedAsCapByOther = captains.some((c, j) => j !== i && c === p.id);
                        const usedAsVCHere = viceCaptains[i] === p.id;
                        return (
                          <option key={p.id} value={p.id} disabled={usedAsCapByOther || usedAsVCHere}>
                            {p.name} {"⭐".repeat(p.stars)}
                            {usedAsCapByOther ? " (captain elsewhere)" : usedAsVCHere ? " (VC this team)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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

      {/* ── Step B2: Vice Captains ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Step B2 — Assign Vice Captains to Teams</h2>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              viceCaptainsReady ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {viceCaptains.filter((c, i) => i < setup.teamCount && !!c && selected.includes(c)).length} / {setup.teamCount}
          </span>
        </div>
        {selected.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Select players in Step A first.</p>
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
                        const isCapHere = captains[i] === p.id;
                        const usedAsVCByOther = viceCaptains.some((c, j) => j !== i && c === p.id);
                        const usedAsCapByOther = captains.some((c, j) => j !== i && c === p.id);
                        const disabled = isCapHere || usedAsVCByOther || usedAsCapByOther;
                        return (
                          <option key={p.id} value={p.id} disabled={disabled}>
                            {p.name} {"⭐".repeat(p.stars)}
                            {isCapHere ? " (captain this team)" : usedAsVCByOther ? " (VC elsewhere)" : usedAsCapByOther ? " (captain elsewhere)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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

      {/* ── Step C: Full Shuffle ─────────────────────────────────────────────── */}
      {shuffleMode === "full" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
          <h2 className="font-bold text-slate-800 mb-1">Step C — Shuffle</h2>
          {special?.enabled && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-800 font-medium">
              <Lock size={12} className="text-amber-600 flex-shrink-0" />
              Special assignment is ON — forced players will be placed in{" "}
              <span className="font-bold">{special.forcedCaptainName}'s</span> team automatically.
            </div>
          )}
          <button
            onClick={runFullShuffle}
            disabled={!canFullShuffle}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition ${
              canFullShuffle
                ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            <Dices size={20} /> Shuffle &amp; Create Teams
          </button>
          {!canFullShuffle && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              Select exactly {requiredPlayers} players and assign all {setup.teamCount} captains and vice captains.
            </p>
          )}
        </div>
      )}

      {/* ── Step C: Single Shuffle Rounds ────────────────────────────────────── */}
      {shuffleMode === "single" && (
        <div className="space-y-4">

          {/* Special assignment notice */}
          {special?.enabled && harishwarIdx !== -1 && forcedPlayers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <Lock size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <span className="font-bold">Special assignment ON:</span>{" "}
                {forcedPlayers.map((p) => p.name).join(", ")} will be automatically placed in{" "}
                <span className="font-bold">{special.forcedCaptainName}'s</span> team and won't appear in the round selection.
              </div>
            </div>
          )}

          {/* Completed rounds */}
          {completedRounds.map((round, roundIdx) => (
            <div
              key={roundIdx}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {roundIdx + 1}
                </div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Round {roundIdx + 1} — Complete
                </h3>
                <Check size={15} className="text-green-600 ml-auto" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {round.map((a) => (
                  <div
                    key={a.teamIndex}
                    className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <span className="text-indigo-800 font-semibold truncate">{a.teamName}</span>
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <ChevronRight size={12} className="text-indigo-400" />
                      <span className="truncate font-medium">{a.player.name}</span>
                      <StarsRow n={a.player.stars} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Current round — only show if not all done */}
          {!allManualRoundsDone && canStartSingleRounds && (
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {currentRoundNumber}
                  </div>
                  <h3 className="font-bold text-slate-800">
                    Round {currentRoundNumber} of {totalExtraSlots}
                  </h3>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    currentRoundPicks.length === teamCount
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {currentRoundPicks.length} / {teamCount} selected
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Select exactly <span className="font-bold text-slate-700">{teamCount}</span> players — one will be randomly assigned to each team.
              </p>

              {availablePool.length === 0 ? (
                <p className="text-sm text-slate-400 py-3 text-center">No more players available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1 mb-3">
                  {availablePool.map((p) => {
                    const isPicked = currentRoundPicks.includes(p.id);
                    const disabledPick = !isPicked && currentRoundPicks.length >= teamCount;
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleRoundPick(p.id)}
                        disabled={disabledPick}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition text-left ${
                          isPicked
                            ? "bg-indigo-50 border-indigo-400 text-indigo-800"
                            : disabledPick
                            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-white border-slate-200 hover:border-indigo-300 text-slate-700"
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="flex items-center gap-1.5">
                          <StarsRow n={p.stars} />
                          {isPicked && <Check size={14} className="text-indigo-600" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={shuffleCurrentRound}
                disabled={currentRoundPicks.length !== teamCount}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white transition ${
                  currentRoundPicks.length === teamCount
                    ? "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                <Shuffle size={18} /> Shuffle Round {currentRoundNumber}
              </button>
            </div>
          )}

          {/* Not ready yet message */}
          {!allManualRoundsDone && !canStartSingleRounds && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700 mb-2">Complete the following to start rounds:</p>
              <ul className="space-y-1.5">
                <li className={`flex items-center gap-2 ${playersReady ? "text-green-600" : "text-slate-500"}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${playersReady ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {playersReady ? "✓" : "A"}
                  </span>
                  Select exactly {requiredPlayers} players{!playersReady && <span className="text-xs text-orange-500 font-medium"> ({selected.length} selected)</span>}
                </li>
                <li className={`flex items-center gap-2 ${captainsReady ? "text-green-600" : "text-slate-500"}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${captainsReady ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {captainsReady ? "✓" : "B"}
                  </span>
                  Assign captains for all {setup.teamCount} teams
                </li>
                <li className={`flex items-center gap-2 ${viceCaptainsReady ? "text-green-600" : "text-slate-500"}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${viceCaptainsReady ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {viceCaptainsReady ? "✓" : "B2"}
                  </span>
                  Assign vice captains for all {setup.teamCount} teams
                </li>
              </ul>
            </div>
          )}

          {/* Finalize */}
          {allManualRoundsDone && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
              <h3 className="font-bold text-slate-800 mb-1">All Rounds Complete! 🎉</h3>
              <p className="text-xs text-slate-500 mb-3">
                All {totalExtraSlots} rounds done. Click below to finalize and save the teams.
              </p>
              {special?.enabled && forcedPlayers.length > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-800 font-medium">
                  <Lock size={12} className="text-amber-600 flex-shrink-0" />
                  {forcedPlayers.map((p) => p.name).join(", ")} will be added to{" "}
                  <span className="font-bold">{special.forcedCaptainName}'s</span> team.
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={resetSingleShuffle}
                  className="flex-1 py-2.5 rounded-xl font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm transition"
                >
                  Reset Rounds
                </button>
                <button
                  onClick={finalizeSingleShuffle}
                  disabled={busy}
                  className={`flex-2 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-bold text-white transition ${
                    busy
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md"
                  }`}
                >
                  <Check size={18} /> Finalize Teams
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
