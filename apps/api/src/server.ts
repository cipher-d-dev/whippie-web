import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import app from "./app.js";

// Start the HTTP server immediately so health checks work regardless of
// whether the MongoDB connection has been established yet.
const server = app.listen(env.PORT, () => {
  console.log(
    `🚀  Whippe API running on http://localhost:${env.PORT} [${env.NODE_ENV}]`
  );
  console.log(`   Health: http://localhost:${env.PORT}/health`);
});

// Connect to MongoDB asynchronously after the server is up.
connectDatabase().catch((err: unknown) => {
  console.error("Fatal database error:", err);
  server.close(() => process.exit(1));
});
