import { useState, useCallback, useEffect } from "react";
import { Header } from "./Header";
import { ManagePlayers } from "./ManagePlayers";
import { TeamSetupTab } from "./TeamSetupTab";
import { ShuffleTab } from "./ShuffleTab";
import { FinalTeams } from "./FinalTeams";
import { Toasts, ToastMsg } from "./Toast";
import { db } from "../db";
import { shuffleTeams } from "../shuffle";
import { Player, TeamSetup, TeamResult, SpecialAssignment } from "../types";
import { Users, Settings, Dices, Trophy } from "lucide-react";

type Tab = "players" | "setup" | "shuffle" | "final";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "players", label: "Manage Players", icon: Users },
  { id: "setup", label: "Team Setup", icon: Settings },
  { id: "shuffle", label: "Shuffle", icon: Dices },
  { id: "final", label: "Final Teams", icon: Trophy },
];

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("players");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const [players, setPlayers] = useState<Player[]>([]);
  const [setup, setSetup] = useState<TeamSetup | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [captains, setCaptains] = useState<string[]>([]);
  const [teams, setTeams] = useState<TeamResult[] | null>(null);
  const [special, setSpecial] = useState<SpecialAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  const push = useCallback(
    (text: string, type: ToastMsg["type"] = "info") => {
      setToasts((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), text, type },
      ]);
    },
    []
  );
  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [p, cfg, t, sa] = await Promise.all([
          db.getPlayers(),
          db.getConfig(),
          db.getTeams(),
          db.getSpecialAssignment(),
        ]);
        setPlayers(p);
        setSetup(cfg);
        setTeams(t);
        setSpecial(sa);
      } catch (e: any) {
        push(e.message || "Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [push]);

  // ---- players ----
  async function addPlayer(p: Player) {
    await db.addPlayer(p);
    setPlayers((prev) => [...prev, p]);
  }
  async function removePlayer(id: string) {
    await db.deletePlayer(id);
    setPlayers((prev) => prev.filter((x) => x.id !== id));
    setSelected((prev) => prev.filter((x) => x !== id));
    // Clear this player from any captain slot
    setCaptains((prev) => prev.map((c) => (c === id ? "" : c)));
  }
  async function clearAllPlayers() {
    await db.clearAllPlayers();
    setPlayers([]);
    setSelected([]);
    setCaptains([]);
  }

  // ---- config ----
  async function saveConfig(s: TeamSetup) {
    await db.saveConfig(s);
    setSetup(s);
  }

  // ---- selection (kept in memory; not persisted as selection state per spec) ----
  function setSelectedState(s: string[]) {
    setSelected(s);
  }
  function setCaptainsState(s: string[]) {
    setCaptains(s);
  }

  // ---- shuffle ----
  async function runShuffle(): Promise<TeamResult[]> {
    if (!setup) throw new Error("No team setup saved");
    const reqPlayers = setup.teamCount * setup.playersPerTeam;
    if (selected.length !== reqPlayers) {
      throw new Error(`Select exactly ${reqPlayers} players`);
    }
    const missingIdx = (setup.teamNames ?? []).findIndex(
      (_, i) => !captains[i]
    );
    if (missingIdx !== -1) {
      throw new Error(
        `No captain assigned for "${setup.teamNames[missingIdx]}"`
      );
    }
    // captains[i] = player id for teamNames[i] — preserve the order
    const captainPlayers = setup.teamNames.map((_, i) =>
      players.find((p) => p.id === captains[i])!
    );
    const captainIds = new Set(captains.slice(0, setup.teamCount));
    const poolPlayers = players.filter(
      (p) => selected.includes(p.id) && !captainIds.has(p.id)
    );

    // Always fetch the latest special assignment fresh so we pick up
    // any toggle the super admin made after this page loaded.
    let freshSpecial = special;
    try {
      freshSpecial = await db.getSpecialAssignment();
      setSpecial(freshSpecial);
    } catch {
      // If fetch fails, fall back to cached value
    }

    const result = shuffleTeams(
      setup.teamNames,
      captainPlayers,
      poolPlayers,
      setup.playersPerTeam,
      freshSpecial
    );
    await db.saveTeams(result.teams);
    setTeams(result.teams);
    return result.teams;
  }

  async function onShuffle() {
    try {
      await runShuffle();
      push("Teams generated!", "success");
    } catch (e: any) {
      push(e.message || "Shuffle failed", "error");
      throw e;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onLogout={onLogout} showLogout />
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <nav className="flex gap-1.5 overflow-x-auto no-print mb-4 bg-white rounded-xl p-1.5 shadow-sm border border-slate-100">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                  active
                    ? "bg-green-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </nav>

        {tab === "players" && (
          <ManagePlayers
            players={players}
            onAdd={addPlayer}
            onRemove={removePlayer}
            onClearAll={clearAllPlayers}
            push={push}
          />
        )}
        {tab === "setup" && (
          <TeamSetupTab
            setup={setup}
            onSave={saveConfig}
            totalPlayers={players.length}
            push={push}
          />
        )}
        {tab === "shuffle" && (
          <ShuffleTab
            players={players}
            setup={setup}
            selected={selected}
            setSelected={setSelectedState}
            captains={captains}
            setCaptains={setCaptainsState}
            onShuffle={onShuffle}
            goToResults={() => setTab("final")}
            push={push}
          />
        )}
        {tab === "final" && (
          <FinalTeams
            teams={teams ?? []}
            push={push}
          />
        )}
      </div>
    </div>
  );
}
