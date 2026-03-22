import app from "./app.js";

const PORT = process.env.PORT || 3003;

async function startServer() {
  try {
    /* ================= START SERVER ================= */
    const server = app.listen(PORT, () => {
      console.log(`🚀 Config Service running on port ${PORT}`);
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
    console.error("❌ Failed to start Config Service:", error);
    process.exit(1);
  }
}

startServer();
