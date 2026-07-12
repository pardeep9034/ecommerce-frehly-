import app from "./app.js";
import initializeModels from "./src/models/index.js";

const PORT = process.env.PORT || 3004;

async function startServer() {
  try {
    await initializeModels();

    console.log("Order Service: Database and models initialized");

    const server = app.listen(PORT, () => {
      console.log(`Order Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");

      server.close(() => {
        console.log("Process terminated");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start Order Service:", error);
    process.exit(1);
  }
}

startServer();
