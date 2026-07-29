import app from "./app.js";
import  initializeModels  from "./src/models/index.js";
import { env } from "./src/config/env.js";

const PORT = env.PORT;

async function startServer() {
  try {
    /* ================= INITIALIZE DATABASE ================= */
    await initializeModels();
    console.log("Delivery Service: Database and models initialized");

    /* ================= START SERVER ================= */
    const server = app.listen(PORT, () => {
      console.log(`Delivery Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
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
    console.error("Failed to start Delivery Service:", error);
    process.exit(1);
  }
}

startServer();
