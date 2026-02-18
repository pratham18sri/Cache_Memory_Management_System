const NodeCache = require('node-cache');
const Cache = require('../models/Cache');

class CacheService {
    constructor() {
        this.ttl = parseInt(process.env.CACHE_TTL) || 300;
        this.maxItems = parseInt(process.env.CACHE_MAX_ITEMS) || 10000;

        // Initialize in-memory cache
        this.memoryCache = new NodeCache({
            stdTTL: this.ttl,
            checkperiod: this.ttl * 0.2,
            maxKeys: this.maxItems
        });

        // Event listener for expired items in memory (optional debugging or sync)
        this.memoryCache.on('expired', (key, value) => {
            console.log(`[Cache] Memory key expired: ${key}`);
            // Note: We don't necessarily delete from DB here because DB might have longer retention,
            // or we rely on DB's own TTL.
        });
    }

    /**
     * Initialize the cache service
     * Loads valid entries from MongoDB into memory
     */
    async init() {
        console.log('[Cache] Initializing...');
        try {
            const count = await Cache.countDocuments();
            // Load only as many as fit in memory or a reasonable batch
            // Sorting by lastAccessed desc to load most relevant data
            const docs = await Cache.find({ expiresAt: { $gt: new Date() } })
                .sort({ lastAccessed: -1 })
                .limit(this.maxItems);

            let loaded = 0;
            docs.forEach(doc => {
                const remainingTTL = Math.ceil((doc.expiresAt - Date.now()) / 1000);
                if (remainingTTL > 0) {
                    this.memoryCache.set(doc.key, doc.value, remainingTTL);
                    loaded++;
                }
            });

            console.log(`[Cache] Restored ${loaded} items from MongoDB (Total in DB: ${count})`);
        } catch (error) {
            console.error('[Cache] Initialization error:', error.message);
        }
    }

    /**
     * Set cache entry
     * @param {string} key 
     * @param {any} value 
     * @param {number} customTTL (seconds)
     */
    async set(key, value, customTTL = null) {
        const ttl = customTTL || this.ttl;
        const expiresAt = new Date(Date.now() + ttl * 1000);

        // 1. Write to Memory
        const success = this.memoryCache.set(key, value, ttl);
        if (!success) {
            console.warn(`[Cache] Failed to set key in memory: ${key}`);
        }

        // 2. Write to MongoDB (Persistent)
        try {
            await Cache.findOneAndUpdate(
                { key },
                {
                    key,
                    value,
                    ttl,
                    lastAccessed: new Date(),
                    expiresAt
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error(`[Cache] DB Sync failed for key: ${key}`, error.message);
            // Optionally decide if we should fail the request or just log
        }

        return true;
    }

    /**
     * Get cache entry
     * @param {string} key 
     */
    async get(key) {
        // 1. Try Memory
        const value = this.memoryCache.get(key);
        if (value !== undefined) {
            // Update lastAccessed in DB asynchronously
            this._touch(key);
            return { data: value, source: 'memory' };
        }

        // 2. Try MongoDB
        try {
            const doc = await Cache.findOne({ key, expiresAt: { $gt: new Date() } });
            if (doc) {
                // Promote to memory
                const remainingTTL = Math.ceil((doc.expiresAt - Date.now()) / 1000);
                if (remainingTTL > 0) {
                    this.memoryCache.set(key, doc.value, remainingTTL);
                }

                // Update lastAccessed
                doc.lastAccessed = new Date();
                await doc.save();

                return { data: doc.value, source: 'database' };
            }
        } catch (error) {
            console.error(`[Cache] Get error for key: ${key}`, error.message);
        }

        return null;
    }

    /**
     * Delete cache entry
     * @param {string} key 
     */
    async del(key) {
        // 1. Delete from Memory
        this.memoryCache.del(key);

        // 2. Delete from MongoDB
        try {
            await Cache.deleteOne({ key });
        } catch (error) {
            console.error(`[Cache] Delete error for key: ${key}`, error.message);
        }
    }

    /**
     * Clear all cache
     */
    async clear() {
        // 1. Flush Memory
        this.memoryCache.flushAll();

        // 2. Clear MongoDB
        try {
            await Cache.deleteMany({});
        } catch (error) {
            console.error('[Cache] Clear error:', error.message);
        }
    }

    /**
     * Get Cache Statistics
     */
    async getStats() {
        const memoryStats = this.memoryCache.getStats();
        const dbCount = await Cache.countDocuments();

        // Calculate memory usage (approximate)
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

        return {
            memory: {
                keys: this.memoryCache.keys().length,
                hits: memoryStats.hits,
                misses: memoryStats.misses,
                ksize: memoryStats.ksize,
                vsize: memoryStats.vsize
            },
            database: {
                count: dbCount
            },
            system: {
                memoryUsageMB: memoryUsage.toFixed(2)
            }
        };
    }

    /**
     * Update access time in DB without blocking
     * @param {string} key 
     */
    async _touch(key) {
        try {
            await Cache.updateOne(
                { key },
                { $set: { lastAccessed: new Date() } }
            );
        } catch (error) {
            // Silently fail for touch updates to avoid spamming logs
        }
    }

    /**
     * Explicit cleanup (though Mongoose TTL handles DB)
     */
    async cleanup() {
        // This is more for sanity check or complex logic not handled by TTL
        // Using Mongoose TTL index is cleaner for basic expiry
        try {
            const result = await Cache.deleteMany({ expiresAt: { $lt: new Date() } });
            if (result.deletedCount > 0) {
                console.log(`[Cache] Cleanup job removed ${result.deletedCount} expired items from DB`);
            }
        } catch (error) {
            console.error('[Cache] Cleanup error:', error.message);
        }
    }
}

module.exports = new CacheService();
