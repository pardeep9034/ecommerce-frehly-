import app from "./app.js";
import initializeModels from "./src/models/index.js";
import { initializeTopology } from "./src/messaging/index.js";
import {registerCartConsumers} from "./src/modules/addToCart/registerConsumers.js";

const PORT = process.env.PORT || 3002;

async function startServer() {

  try {

    /* ================= INITIALIZE DATABASE ================= */

    await initializeModels();

    console.log("✅ Cart Service: Database and models initialized");
    await initializeTopology();
    console.log("✅ Cart Service: Messaging topology initialized");
    await registerCartConsumers();
    console.log("✅ Cart Service: Consumers registered");

    /* ================= START SERVER ================= */

    const server = app.listen(PORT, () => {

      console.log(`🚀 Cart Service running on port ${PORT}`);
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

    console.error("❌ Failed to start Cart Service:", error);

    process.exit(1);

  }

}

startServer();