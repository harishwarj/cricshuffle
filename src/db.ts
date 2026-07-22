import { Player, TeamResult, TeamSetup } from "./types";

// Base URL for the Express API — set VITE_API_URL in your root .env file
// Falls back to http://localhost:5001 for local development, and relative `/` for production
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:5001");

// ── Helper ────────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      // ignore parse errors on error bodies
    }
    throw new Error(msg);
  }
  // 204 No Content or empty body
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

// ── db object — same function names + return shapes as before ─────────────────

export const db = {
  // ---------- Players ----------

  async getPlayers(): Promise<Player[]> {
    return apiFetch<Player[]>("/api/players");
  },

  async addPlayer(p: Player): Promise<void> {
    await apiFetch<void>("/api/players", {
      method: "POST",
      body: JSON.stringify({ id: p.id, name: p.name, stars: p.stars }),
    });
  },

  async deletePlayer(id: string): Promise<void> {
    await apiFetch<void>(`/api/players/${id}`, { method: "DELETE" });
  },

  async clearAllPlayers(): Promise<void> {
    await apiFetch<void>("/api/players", { method: "DELETE" });
  },

  // ---------- Tournament config ----------

  async getConfig(): Promise<TeamSetup | null> {
    return apiFetch<TeamSetup | null>("/api/config");
  },

  async saveConfig(setup: TeamSetup): Promise<void> {
    await apiFetch<void>("/api/config", {
      method: "POST",
      body: JSON.stringify({
        teamCount: setup.teamCount,
        playersPerTeam: setup.playersPerTeam,
        teamNames: setup.teamNames,
      }),
    });
  },

  // ---------- Special assignment ----------

  async getSpecialAssignment(): Promise<{
    enabled: boolean;
    forcedCaptainName: string;
    forcedPlayerNames: string[];
  }> {
    return apiFetch("/api/special-assignment");
  },

  async setSpecialEnabled(enabled: boolean): Promise<void> {
    await apiFetch<void>("/api/special-assignment", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
  },

  // ---------- Teams ----------

  async getTeams(): Promise<TeamResult[] | null> {
    return apiFetch<TeamResult[] | null>("/api/teams");
  },

  async saveTeams(teams: TeamResult[]): Promise<void> {
    await apiFetch<void>("/api/teams", {
      method: "POST",
      body: JSON.stringify(teams),
    });
  },
};
