export type StarLevel = 2 | 3 | 4 | 5;

export interface Player {
  id: string;
  name: string;
  stars: StarLevel;
}

export interface TeamSetup {
  teamCount: number;
  playersPerTeam: number;
  teamNames: string[];
}

export interface TeamResult {
  name: string;
  captain: Player;
  viceCaptain: Player;
  players: Player[];
}

export type AuthRole = "alpha" | "superadmin" | null;

export interface SpecialAssignment {
  enabled: boolean;
  forcedCaptainName: string;
  forcedPlayerNames: string[];
}
