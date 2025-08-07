// services/auth-service/src/server.js
const app = require('./app');
const { initializeModels } = require('./models');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize database and models
    await initializeModels();
    console.log('✅ Auth Service: Database and models initialized');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Auth Service running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start Auth Service:', error);
    process.exit(1);
  }
}
startServer();
