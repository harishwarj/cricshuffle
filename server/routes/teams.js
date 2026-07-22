const express = require("express");
const router = express.Router();
const Team = require("../models/Team");

// GET /api/teams — return all teams with embedded captain and players
router.get("/", async (_req, res) => {
  try {
    const teams = await Team.find().sort({ createdAt: 1 });
    if (!teams || teams.length === 0) {
      return res.json(null); // frontend expects null when no teams saved yet
    }
    const result = teams.map((t) => ({
      name: t.name,
      captain: t.captain,
      players: t.players,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/teams — replace all teams (delete existing, insert new)
// Body: Array of { name, captain: Player, players: Player[] }
router.post("/", async (req, res) => {
  try {
    const teams = req.body;
    if (!Array.isArray(teams)) {
      return res.status(400).json({ error: "Body must be an array of teams" });
    }

    // Atomic replace: delete all then insert
    await Team.deleteMany({});

    if (teams.length === 0) {
      return res.json({ ok: true, count: 0 });
    }

    const docs = teams.map((t) => ({
      name: t.name,
      captain: t.captain,
      players: t.players ?? [],
    }));
    await Team.insertMany(docs);

    res.json({ ok: true, count: docs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
