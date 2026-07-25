const mongoose = require("mongoose");

// Singleton document: always upserted at _id = 1
const specialAssignmentSchema = new mongoose.Schema({
  _id: { type: Number, default: 1 },
  enabled: { type: Boolean, default: false },
  forcedCaptainName: { type: String, default: "Harishwar" },
  forcedPlayerNames: {
    type: [String],
    default: ["Roshan", "Hari Krishnan", "Dhanush", "Vijay Prakash"],
  },
});

module.exports = mongoose.model("SpecialAssignment", specialAssignmentSchema);
