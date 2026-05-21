import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import schoolRoutes from "./routes/school.routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import { testConnection } from "./config/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Utility Middleware ────────────────────────────────────────────
app.use(helmet());                          // sets secure HTTP headers
app.use(cors());                            // allows cross-origin requests
app.use(express.json());                    // parse JSON body
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));                     // request logger

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Server is running", uptime: process.uptime() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/", schoolRoutes);

// ─── Error Handlers (must be last) ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  await testConnection();
  console.log("✅ MySQL connection pool established");

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   ENV: ${process.env.NODE_ENV || "development"}`);
  });
};

// Export app for testing (without starting server)
export { app };

// Only boot when run directly, not during tests
if (require.main === module) {
  startServer().catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
}
