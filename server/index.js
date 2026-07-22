const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const playersRouter = require("./routes/players");
const teamsRouter = require("./routes/teams");
const configRouter = require("./routes/config");
const specialAssignmentRouter = require("./routes/specialAssignment");

const app = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. curl, Postman) or any localhost origin
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS: origin not allowed — " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/players", playersRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/config", configRouter);
app.use("/api/special-assignment", specialAssignmentRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── MongoDB connection + server start ────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error(
    "[server] ERROR: MONGODB_URI is not set. Create server/.env with MONGODB_URI=<your atlas URI>"
  );
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("[server] Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`[server] Listening on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("[server] MongoDB connection error:", err.message);
    process.exit(1);
  });
