import app from "./app.js";
import  initializeModels  from "./src/models/index.js";

const PORT = process.env.PORT || 3002;

async function startServer() {

  try {

    /* ================= INITIALIZE DATABASE ================= */

    await initializeModels();

    console.log("✅ Product Service: Database and models initialized");

    /* ================= START SERVER ================= */

    const server = app.listen(PORT, () => {

      console.log(`🚀 Product Service running on port ${PORT}`);
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

    console.error("❌ Failed to start Product Service:", error);

    process.exit(1);

  }

}

startServer();