const mongoose = require("mongoose");

// Singleton document: always upserted at _id = 1
const tournamentConfigSchema = new mongoose.Schema({
  _id: { type: Number, default: 1 },
  totalTeams: { type: Number, required: true },
  playersPerTeam: { type: Number, required: true },
  teamNames: { type: [String], default: [] },
});

module.exports = mongoose.model("TournamentConfig", tournamentConfigSchema);
