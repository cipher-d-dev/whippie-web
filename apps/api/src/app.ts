import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";

import { env, corsOrigins } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";

const app = express();

// ── Security / transport middleware ────────────────────────────────────
app.set("trust proxy", 1);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

// ── Body parsing ────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Session ─────────────────────────────────────────────────────────────
// Phase 1 will harden session configuration (store, cookie settings, etc.)
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

// ── Health check ─────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API routes ───────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// ── 404 + error handlers (must be last) ─────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
