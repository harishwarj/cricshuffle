const express = require("express");
const router = express.Router();
const SpecialAssignment = require("../models/SpecialAssignment");

const DEFAULTS = {
  enabled: false,
  forcedCaptainName: "Harishwar",
  forcedPlayerNames: ["Roshan", "Hari Krishnan", "Dhanush", "Vijay Prakash"],
};

// GET /api/special-assignment — return current state or defaults
router.get("/", async (_req, res) => {
  try {
    const doc = await SpecialAssignment.findById(1);
    if (!doc) return res.json(DEFAULTS);
    res.json({
      enabled: doc.enabled,
      forcedCaptainName: doc.forcedCaptainName,
      forcedPlayerNames: doc.forcedPlayerNames ?? [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/special-assignment — upsert (toggle enabled, optionally update names)
// Body: { enabled }  or  { enabled, forcedCaptainName, forcedPlayerNames }
router.post("/", async (req, res) => {
  try {
    const { enabled, forcedCaptainName, forcedPlayerNames } = req.body;

    const update = {};
    if (enabled !== undefined) update.enabled = enabled;
    if (forcedCaptainName !== undefined) update.forcedCaptainName = forcedCaptainName;
    if (forcedPlayerNames !== undefined) update.forcedPlayerNames = forcedPlayerNames;

    // Build $setOnInsert with only fields NOT already in $set to avoid
    // MongoDB "conflict at path" error when the same key appears in both.
    const setOnInsert = { _id: 1 };
    if (update.forcedCaptainName === undefined)
      setOnInsert.forcedCaptainName = DEFAULTS.forcedCaptainName;
    if (update.forcedPlayerNames === undefined)
      setOnInsert.forcedPlayerNames = DEFAULTS.forcedPlayerNames;
    if (update.enabled === undefined)
      setOnInsert.enabled = DEFAULTS.enabled;

    await SpecialAssignment.findByIdAndUpdate(
      1,
      { $set: update, $setOnInsert: setOnInsert },
      { upsert: true, new: true }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
