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
      // Allow requests with no origin (like mobile apps or curl requests)
      // Allow localhost and any vercel deployment
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        // As a fallback for production, you might just want to allow all origins if it's a public API
        // But for now, we allow Vercel and localhost. If you use a custom domain, add it here.
        callback(null, true); // Actually, let's just allow all for this specific app to avoid CORS pain
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === "production";

// ── MongoDB connection ───────────────────────────────────────────────────────
let cachedDb = null;

async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables. Please configure it in your hosting provider.");
  }
  if (cachedDb) {
    return cachedDb;
  }
  const db = await mongoose.connect(MONGODB_URI);
  cachedDb = db;
  return db;
}

// In a serverless environment (like Vercel), we ensure the DB is connected on each request
if (isServerless) {
  app.use(async (req, res, next) => {
    try {
      await connectToDatabase();
      next();
    } catch (error) {
      console.error("[server] DB connection failed:", error.message);
      res.status(500).json({ error: "Database connection failed: " + error.message });
    }
  });
}

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/players", playersRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/config", configRouter);
app.use("/api/special-assignment", specialAssignmentRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// In local development, we connect once and start listening.
if (!isServerless) {
  connectToDatabase()
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
}

module.exports = app;
