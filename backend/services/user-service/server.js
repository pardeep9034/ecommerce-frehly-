import app from "./app.js";
import { initializeModels } from "./src/models/index.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    /* ================= INITIALIZE DATABASE ================= */
    await initializeModels();

    /* ================= START SERVER ================= */
    const server = app.listen(PORT, () => {
      console.log(`🚀 User Service running on port ${PORT}`);
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
    console.error("❌ Failed to start User Service:", error);
    process.exit(1);
  }
}

startServer();
