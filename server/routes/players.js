const express = require("express");
const router = express.Router();
const Player = require("../models/Player");

// GET /api/players — return all players sorted by creation time
router.get("/", async (_req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: 1 });
    // Map to the shape the frontend expects: { id, name, stars }
    const result = players.map((p) => ({
      id: p.id,
      name: p.name,
      stars: p.starLevel,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/players — add a new player
// Body: { id, name, stars }
router.post("/", async (req, res) => {
  try {
    const { id, name, stars } = req.body;
    if (!id || !name || !stars) {
      return res.status(400).json({ error: "id, name, and stars are required" });
    }
    const player = new Player({ id, name, starLevel: stars });
    await player.save();
    res.status(201).json({ id: player.id, name: player.name, stars: player.starLevel });
  } catch (err) {
    // Duplicate key (id conflict)
    if (err.code === 11000) {
      return res.status(409).json({ error: "Player with this id already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/players/:id — update a player (e.g. mark selected/captain)
// Body: any subset of { name, stars, isCaptain, isSelected, teamId }
router.put("/:id", async (req, res) => {
  try {
    const { name, stars, isCaptain, isSelected, teamId } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (stars !== undefined) update.starLevel = stars;
    if (isCaptain !== undefined) update.isCaptain = isCaptain;
    if (isSelected !== undefined) update.isSelected = isSelected;
    if (teamId !== undefined) update.teamId = teamId;

    const player = await Player.findOneAndUpdate(
      { id: req.params.id },
      { $set: update },
      { new: true }
    );
    if (!player) return res.status(404).json({ error: "Player not found" });
    res.json({ id: player.id, name: player.name, stars: player.starLevel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/players/:id — delete a single player by frontend id
router.delete("/:id", async (req, res) => {
  try {
    await Player.findOneAndDelete({ id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/players — clear ALL players
router.delete("/", async (_req, res) => {
  try {
    await Player.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
