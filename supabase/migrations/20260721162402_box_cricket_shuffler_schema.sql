/*
# Box Cricket Team Shuffler — core schema

## Purpose
Persist players, tournament config, final generated teams, and the Super Admin
"special assignment" toggle so data survives across devices and browser
sessions. Replaces the previous localStorage-only persistence.

This is a single-tenant app: the "login" is a hardcoded frontend gate, NOT
Supabase auth. The frontend therefore talks to Supabase with the anon key
only, so every policy is scoped to `TO anon, authenticated` with `USING (true)`
because the data is intentionally shared/public across whoever uses the app.

## New Tables

1. `players`
   - `id` uuid primary key
   - `name` text not null
   - `star_level` int not null (3, 4, or 5)
   - `is_captain` boolean default false  (selected as a captain for the tournament)
   - `is_selected` boolean default false (selected into the tournament pool)
   - `team_id` text nullable (which final team the player landed on, if any)
   - `created_at` timestamptz default now()

2. `teams`
   - `id` uuid primary key
   - `name` text not null (team name)
   - `captain` jsonb not null (full Player object of the captain)
   - `players` jsonb not null default '[]' (array of full Player objects)
   - `created_at` timestamptz default now()
   Stores the most recent shuffle result. We store full player objects (not
   just ids) so the Final Teams view can render without a join.

3. `tournament_config` (single-row config table)
   - `id` int primary key default 1
   - `total_teams` int not null default 8
   - `players_per_team` int not null default 7
   - `team_names` jsonb not null default '[]' (array of team name strings)

4. `special_assignment` (single-row config table)
   - `id` int primary key default 1
   - `enabled` boolean not null default false
   - `forced_captain_name` text not null default 'Harishwar'
   - `forced_player_names` jsonb not null default
     '["Roshan","Hari Krishnan","Suresh","Rahul"]'

## Security
- RLS enabled on all tables.
- All CRUD open to `anon, authenticated` (intentionally shared single-tenant data).
*/

-- players
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  star_level int NOT NULL CHECK (star_level IN (3,4,5)),
  is_captain boolean NOT NULL DEFAULT false,
  is_selected boolean NOT NULL DEFAULT false,
  team_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);

-- teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  captain jsonb NOT NULL,
  players jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_teams" ON teams;
CREATE POLICY "anon_select_teams" ON teams FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
CREATE POLICY "anon_insert_teams" ON teams FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_teams" ON teams;
CREATE POLICY "anon_update_teams" ON teams FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
CREATE POLICY "anon_delete_teams" ON teams FOR DELETE
  TO anon, authenticated USING (true);

-- tournament_config (single row)
CREATE TABLE IF NOT EXISTS tournament_config (
  id int PRIMARY KEY DEFAULT 1,
  total_teams int NOT NULL DEFAULT 8,
  players_per_team int NOT NULL DEFAULT 7,
  team_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT tournament_config_singleton CHECK (id = 1)
);
ALTER TABLE tournament_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_config" ON tournament_config;
CREATE POLICY "anon_select_config" ON tournament_config FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_config" ON tournament_config;
CREATE POLICY "anon_insert_config" ON tournament_config FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_config" ON tournament_config;
CREATE POLICY "anon_update_config" ON tournament_config FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_config" ON tournament_config;
CREATE POLICY "anon_delete_config" ON tournament_config FOR DELETE
  TO anon, authenticated USING (true);

-- special_assignment (single row)
CREATE TABLE IF NOT EXISTS special_assignment (
  id int PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT false,
  forced_captain_name text NOT NULL DEFAULT 'Harishwar',
  forced_player_names jsonb NOT NULL DEFAULT '["Roshan","Hari Krishnan","Suresh","Rahul"]'::jsonb,
  CONSTRAINT special_assignment_singleton CHECK (id = 1)
);
ALTER TABLE special_assignment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_special" ON special_assignment;
CREATE POLICY "anon_select_special" ON special_assignment FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_special" ON special_assignment;
CREATE POLICY "anon_insert_special" ON special_assignment FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_special" ON special_assignment;
CREATE POLICY "anon_update_special" ON special_assignment FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_special" ON special_assignment;
CREATE POLICY "anon_delete_special" ON special_assignment FOR DELETE
  TO anon, authenticated USING (true);

-- seed single-row config rows if absent
INSERT INTO tournament_config (id, total_teams, players_per_team, team_names)
VALUES (1, 8, 7, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO special_assignment (id, enabled, forced_captain_name, forced_player_names)
VALUES (1, false, 'Harishwar', '["Roshan","Hari Krishnan","Suresh","Rahul"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
