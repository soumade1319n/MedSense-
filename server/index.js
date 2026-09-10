import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import "dotenv/config";

import diagnoseRouter from "./routes/diagnose.js";
import analyticsRouter from "./routes/analytics.js";
import historyRouter from "./routes/history.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/medsense";

app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json({ limit: "10kb" }));

// Basic abuse protection on the diagnose endpoint (20 req/min/IP per PRD section 8)
const diagnoseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment and try again." },
});

app.use("/api/diagnose", diagnoseLimiter, diagnoseRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/history", historyRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

let finalMongoUri = MONGO_URI;
let mongoServer;

async function startServer() {
  try {
    // Try to connect to configured MONGO_URI (limit timeout to fail fast on local if not running)
    await mongoose.connect(finalMongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB connected to: ${finalMongoUri}`);
  } catch (err) {
    if (finalMongoUri.includes("localhost") || finalMongoUri.includes("127.0.0.1")) {
      console.warn("Local MongoDB connection failed. Booting up in-memory MongoDB fallback...");
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        mongoServer = await MongoMemoryServer.create();
        finalMongoUri = mongoServer.getUri();
        await mongoose.connect(finalMongoUri);
        console.log(`In-memory MongoDB started and connected to: ${finalMongoUri}`);
      } catch (memErr) {
        console.error("Failed to start in-memory MongoDB:", memErr.message);
        process.exit(1);
      }
    } else {
      console.error("MongoDB connection failed:", err.message);
      process.exit(1);
    }
  }

  app.listen(PORT, () => console.log(`MedSense API listening on :${PORT}`));
}

startServer();

