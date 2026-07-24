const mongoose = require("mongoose");

// Embedded player shape — mirrors the frontend Player type exactly
const embeddedPlayerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    stars: { type: Number, enum: [2, 3, 4, 5], required: true },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // Captain stored as embedded object (same shape as frontend Player)
    captain: { type: embeddedPlayerSchema, required: true },
    // Vice Captain stored as embedded object
    viceCaptain: { type: embeddedPlayerSchema, required: true },
    // Players stored as array of embedded objects
    players: { type: [embeddedPlayerSchema], default: [] },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("Team", teamSchema);
