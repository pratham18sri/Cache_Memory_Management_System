const cacheService = require('../services/cacheService');

// @desc    Store a cache entry
// @route   POST /cache
// @access  Public
exports.setCache = async (req, res, next) => {
    try {
        const { key, value, ttl } = req.body;

        if (!key || value === undefined) {
            return res.status(400).json({ success: false, error: 'Key and value are required' });
        }

        await cacheService.set(key, value, ttl);

        res.status(201).json({
            success: true,
            message: 'Cache entry stored',
            data: { key, ttl: ttl || cacheService.ttl }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Retrieve a cache entry
// @route   GET /cache/:key
// @access  Public
exports.getCache = async (req, res, next) => {
    try {
        const { key } = req.params;

        const result = await cacheService.get(key);

        if (!result) {
            return res.status(404).json({ success: false, error: 'Cache miss' });
        }

        res.status(200).json({
            success: true,
            source: result.source,
            data: result.data
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a cache entry
// @route   DELETE /cache/:key
// @access  Public
exports.deleteCache = async (req, res, next) => {
    try {
        const { key } = req.params;

        await cacheService.del(key);

        res.status(200).json({
            success: true,
            message: `Cache entry '${key}' deleted`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear all cache
// @route   DELETE /cache
// @access  Public
exports.clearCache = async (req, res, next) => {
    try {
        await cacheService.clear();

        res.status(200).json({
            success: true,
            message: 'All cache entries cleared'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get cache stats
// @route   GET /cache/stats
// @access  Public
exports.getStats = async (req, res, next) => {
    try {
        const stats = await cacheService.getStats();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
