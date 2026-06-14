import app from "./app.js";
import database from "./src/config/database.js";
import { initializeModels } from "./src/models/index.js";

const PORT = process.env.PORT || 3003;

async function startServer() {
  try {
    /* ================= INITIALIZE DATABASE ================= */
    await database.connect();
    await initializeModels();
    console.log("✅ Delivery Service: Models initialized");

    /* ================= START SERVER ================= */
    const server = app.listen(PORT, () => {
      console.log(`🚀 Delivery Service running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });

    /* ================= GRACEFUL SHUTDOWN ================= */
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("Process terminated");
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("❌ Failed to start Delivery Service:", error);
    process.exit(1);
  }
}

startServer();
