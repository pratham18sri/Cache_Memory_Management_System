require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const cacheRoutes = require('./routes/cacheRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const cacheService = require('./services/cacheService');

const app = express();

// Middleware
app.use(express.json({ limit: '1mb' }));

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbConnected = dbState === 1;

    return res.status(dbConnected ? 200 : 503).json({
        success: dbConnected,
        service: 'hybrid-cache-system',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
            status: dbConnected ? 'connected' : 'disconnected'
        }
    });
});

app.use('/cache', cacheRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to Database and Start Server
let cleanupInterval = null;
let server = null;

const startServer = async () => {
    await connectDB();
    await cacheService.init();

    // Start Cleanup Job (run every 1 hour as a safeguard)
    cleanupInterval = setInterval(() => {
        cacheService.cleanup();
    }, 60 * 60 * 1000);

    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    let shuttingDown = false;

    // Graceful Shutdown
    const shutdown = async () => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;

        console.log('\nStarting graceful shutdown...');

        if (cleanupInterval) {
            clearInterval(cleanupInterval);
            cleanupInterval = null;
        }

        if (server) {
            console.log('Closing HTTP server...');
            await new Promise((resolve) => server.close(resolve));
            console.log('HTTP server closed.');
        }

        await mongoose.connection.close();
        console.log('MongoDB connection closed.');

        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
};

startServer().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
});
