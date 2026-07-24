const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    // Frontend-generated string ID (not MongoDB's _id)
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    starLevel: { type: Number, enum: [2, 3, 4, 5], required: true },
    isCaptain: { type: Boolean, default: false },
    isSelected: { type: Boolean, default: false },
    teamId: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("Player", playerSchema);
