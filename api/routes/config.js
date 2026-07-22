const express = require("express");
const router = express.Router();
const TournamentConfig = require("../models/TournamentConfig");

// GET /api/config — return current tournament config or null if not set
router.get("/", async (_req, res) => {
  try {
    const config = await TournamentConfig.findById(1);
    if (!config) return res.json(null);
    res.json({
      teamCount: config.totalTeams,
      playersPerTeam: config.playersPerTeam,
      teamNames: config.teamNames ?? [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config — upsert the config (singleton at _id=1)
// Body: { teamCount, playersPerTeam, teamNames }
router.post("/", async (req, res) => {
  try {
    const { teamCount, playersPerTeam, teamNames } = req.body;
    if (!teamCount || !playersPerTeam) {
      return res
        .status(400)
        .json({ error: "teamCount and playersPerTeam are required" });
    }

    await TournamentConfig.findByIdAndUpdate(
      1,
      {
        _id: 1,
        totalTeams: teamCount,
        playersPerTeam,
        teamNames: teamNames ?? [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
