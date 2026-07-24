import { useState } from "react";
import { Player, StarLevel } from "../types";
import { uid } from "../storage";
import { Plus, Trash2, X, Star } from "lucide-react";

export function ManagePlayers({
  players,
  onAdd,
  onRemove,
  onClearAll,
  push,
}: {
  players: Player[];
  onAdd: (p: Player) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  push: (text: string, type?: "success" | "error" | "info") => void;
}) {
  const [name, setName] = useState("");
  const [stars, setStars] = useState<StarLevel>(3);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      push("Player name cannot be empty", "error");
      return;
    }
    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      push("Player already added", "error");
      return;
    }
    setBusy(true);
    try {
      await onAdd({ id: uid(), name: trimmed, stars });
      setName("");
      setStars(3);
      push("Player added", "success");
    } catch (e: any) {
      push(e.message || "Failed to add player", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await onRemove(id);
      push("Player removed", "info");
    } catch (e: any) {
      push(e.message || "Failed to remove player", "error");
    }
  }

  async function clearAll() {
    setConfirmClear(false);
    try {
      await onClearAll();
      push("All players cleared", "info");
    } catch (e: any) {
      push(e.message || "Failed to clear players", "error");
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={add}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5"
      >
        <h2 className="font-bold text-slate-800 mb-3">Add Player</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player name"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex items-center gap-1">
            {[2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStars(s as StarLevel)}
                className={`flex items-center gap-0.5 px-2.5 py-2 rounded-lg border text-sm font-semibold transition ${
                  stars === s
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-600 border-slate-300 hover:border-orange-300"
                }`}
              >
                {s}
                <Star size={14} fill={stars === s ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Players</h2>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              players.length >= 56
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Total Players Added: {players.length} / 56
          </span>
        </div>

        {players.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No players yet. Add your first player above.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-0.5 text-orange-500">
                    {Array.from({ length: p.stars }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </span>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition"
                    aria-label="Delete player"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {players.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium"
              >
                <X size={15} /> Clear All Players
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-red-700 font-medium">
                  Are you sure?
                </span>
                <button
                  onClick={clearAll}
                  className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-md font-semibold"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs bg-white text-slate-600 border border-slate-300 px-2.5 py-1 rounded-md font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
