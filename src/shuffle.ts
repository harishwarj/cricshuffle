import { Player, StarLevel, TeamResult, SpecialAssignment } from "./types";

export function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface ShuffleResult {
  teams: TeamResult[];
  warning?: string;
}

function distributeByStar(
  teams: TeamResult[],
  pool: Player[],
  slotsPerTeam: number,
  remaining: number[]
) {
  const byStar: Record<StarLevel, Player[]> = {
    5: fisherYates(pool.filter((p) => p.stars === 5)),
    4: fisherYates(pool.filter((p) => p.stars === 4)),
    3: fisherYates(pool.filter((p) => p.stars === 3)),
  };
  const starOrder: StarLevel[] = [5, 4, 3];
  const teamCount = teams.length;

  for (const star of starOrder) {
    const group = byStar[star];
    let idx = 0;
    const startOffset = Math.floor(Math.random() * teamCount);
    for (const player of group) {
      let placed = false;
      for (let step = 0; step < teamCount; step++) {
        const t = (startOffset + idx + step) % teamCount;
        if (remaining[t] > 0) {
          teams[t].players.push(player);
          remaining[t]--;
          idx++;
          placed = true;
          break;
        }
      }
      if (!placed) break;
    }
  }

  // Fill any leftover slots with remaining pool players
  const placedIds = new Set<string>();
  for (const t of teams) {
    for (const p of t.players) placedIds.add(p.id);
  }
  const leftover = fisherYates(pool.filter((p) => !placedIds.has(p.id)));
  let li = 0;
  for (let t = 0; t < teamCount; t++) {
    while (remaining[t] > 0 && li < leftover.length) {
      teams[t].players.push(leftover[li]);
      remaining[t]--;
      li++;
    }
  }
}

/**
 * Shuffle algorithm.
 *
 * Normal mode:
 * 1. Randomly assign captains to team names.
 * 2. Pool = selected players minus captains.
 * 3. Group pool by star level, shuffle each.
 * 4. Round-robin distribute each star group across teams.
 * 5. Each team ends with captain + (playersPerTeam - 1) pool players.
 *
 * Special assignment ON:
 * - Run normal captain assignment first.
 * - Find the team whose captain name === forcedCaptainName.
 * - Force forcedPlayerNames into that team, removing them from the pool
 *   before star-balanced distribution.
 * - Fill that team's remaining slots from the leftover pool.
 * - All other teams filled via normal star-balanced distribution.
 * - If forcedCaptainName is not among selected captains, return a warning
 *   and do a normal shuffle.
 */
export function shuffleTeams(
  teamNames: string[],
  captains: Player[],
  pool: Player[],
  playersPerTeam: number,
  special?: SpecialAssignment | null
): ShuffleResult {
  // Team names and captains are in fixed order (user-assigned).
  // captains[i] is the captain for teamNames[i].
  const teamCount = teamNames.length;
  const teams: TeamResult[] = teamNames.map((name, i) => ({
    name,
    captain: captains[i],
    players: [],
  }));

  const slotsPerTeam = playersPerTeam - 1;
  const remaining = new Array(teamCount).fill(slotsPerTeam);

  let workingPool = [...pool];
  let warning: string | undefined;

  if (special?.enabled) {
    const forcedCaptainName = special.forcedCaptainName;
    const forcedPlayerNames = special.forcedPlayerNames;

    const harishwarTeamIndex = teams.findIndex(
      (t) => t.captain.name.toLowerCase() === forcedCaptainName.toLowerCase()
    );

    if (harishwarTeamIndex === -1) {
      warning = `Special assignment is ON but ${forcedCaptainName} is not selected as a captain — proceeding with normal random shuffle.`;
      // fall through to normal distribution
    } else {
      // Force the named players into Harishwar's team
      const forcedIds = new Set<string>();
      for (const forcedName of forcedPlayerNames) {
        const match = workingPool.find(
          (p) => p.name.toLowerCase() === forcedName.toLowerCase()
        );
        if (match && remaining[harishwarTeamIndex] > 0) {
          teams[harishwarTeamIndex].players.push(match);
          remaining[harishwarTeamIndex]--;
          forcedIds.add(match.id);
        }
      }
      // Remove forced players from the pool so they aren't double-counted
      workingPool = workingPool.filter((p) => !forcedIds.has(p.id));

      // Fill Harishwar's remaining slots first, trying to keep star balance
      // by drawing from star-sorted leftover pool
      if (remaining[harishwarTeamIndex] > 0) {
        const harishwarPool = fisherYates(workingPool);
        // try to balance: sort by star desc then shuffle within
        const starGroups: Record<StarLevel, Player[]> = {
          5: fisherYates(harishwarPool.filter((p) => p.stars === 5)),
          4: fisherYates(harishwarPool.filter((p) => p.stars === 4)),
          3: fisherYates(harishwarPool.filter((p) => p.stars === 3)),
        };
        const order: StarLevel[] = [5, 4, 3];
        const used = new Set<string>();
        while (remaining[harishwarTeamIndex] > 0) {
          let progressed = false;
          for (const s of order) {
            if (remaining[harishwarTeamIndex] <= 0) break;
            const g = starGroups[s];
            if (g.length > 0) {
              const p = g.shift()!;
              teams[harishwarTeamIndex].players.push(p);
              remaining[harishwarTeamIndex]--;
              used.add(p.id);
              progressed = true;
            }
          }
          if (!progressed) break;
        }
        workingPool = workingPool.filter((p) => !used.has(p.id));
      }

      // Distribute the rest across the other teams with star balance
      // Build a reduced pool and reduced teams/remaining arrays for distribution,
      // then map back to the original team indices.
      const otherIndices = teams
        .map((_, i) => i)
        .filter((i) => i !== harishwarTeamIndex);
      const otherTeams = otherIndices.map((i) => teams[i]);
      const otherRemaining = otherIndices.map((i) => remaining[i]);

      // Use a temporary structure to distribute, then write back
      const tempTeams: TeamResult[] = otherTeams.map((t) => ({
        name: t.name,
        captain: t.captain,
        players: [],
      }));
      const tempRemaining = [...otherRemaining];

      // distribute by star across other teams
      const byStar: Record<StarLevel, Player[]> = {
        5: fisherYates(workingPool.filter((p) => p.stars === 5)),
        4: fisherYates(workingPool.filter((p) => p.stars === 4)),
        3: fisherYates(workingPool.filter((p) => p.stars === 3)),
      };
      const starOrder: StarLevel[] = [5, 4, 3];
      for (const star of starOrder) {
        const group = byStar[star];
        let idx = 0;
        const startOffset = Math.floor(Math.random() * tempTeams.length);
        for (const player of group) {
          let placed = false;
          for (let step = 0; step < tempTeams.length; step++) {
            const t = (startOffset + idx + step) % tempTeams.length;
            if (tempRemaining[t] > 0) {
              tempTeams[t].players.push(player);
              tempRemaining[t]--;
              idx++;
              placed = true;
              break;
            }
          }
          if (!placed) break;
        }
      }

      // leftover fill for other teams
      const placedIds = new Set<string>();
      for (const t of tempTeams) {
        for (const p of t.players) placedIds.add(p.id);
      }
      const leftover = fisherYates(workingPool.filter((p) => !placedIds.has(p.id)));
      let li = 0;
      for (let t = 0; t < tempTeams.length; t++) {
        while (tempRemaining[t] > 0 && li < leftover.length) {
          tempTeams[t].players.push(leftover[li]);
          tempRemaining[t]--;
          li++;
        }
      }

      // write back
      otherIndices.forEach((origIdx, j) => {
        teams[origIdx].players = tempTeams[j].players;
        remaining[origIdx] = tempRemaining[j];
      });

      // Randomise Harishwar's player order so forced names
      // don't appear consecutively at the top of the list.
      teams[harishwarTeamIndex].players = fisherYates(
        teams[harishwarTeamIndex].players
      );

      return { teams, warning };
    }
  }

  // Normal distribution
  distributeByStar(teams, workingPool, slotsPerTeam, remaining);
  return { teams, warning };
}
