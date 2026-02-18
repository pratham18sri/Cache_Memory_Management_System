require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cacheRoutes = require('./routes/cacheRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const cacheService = require('./services/cacheService');

const app = express();

// Middleware
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/cache', cacheRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to Database and Start Server
connectDB().then(async () => {
    // Initialize Cache Service (Recover from DB)
    await cacheService.init();

    // Start Cleanup Job (run every 1 hour as a safeguard)
    setInterval(() => {
        cacheService.cleanup();
    }, 60 * 60 * 1000);

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
        console.log('\nStarting graceful shutdown...');

        // In a real scenario, you might want to save current memory cache state 
        // back to DB if it wasn't already synced.
        // Since our 'sets' are write-through, we are mostly safe.
        // We could initiate a final cleanup or flush if needed.

        console.log('Closing HTTP server...');
        server.close(async () => {
            console.log('HTTP server closed.');
            // Close DB connection if needed, though Mongoose usually handles this.
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
});
