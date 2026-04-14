const cacheService = require('../services/cacheService');

const MAX_KEY_LENGTH = 128;
const MAX_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const parseTTL = (ttl) => {
    if (ttl === undefined || ttl === null || ttl === '') {
        return null;
    }

    const parsed = Number(ttl);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_TTL_SECONDS) {
        return { error: `TTL must be an integer between 1 and ${MAX_TTL_SECONDS} seconds` };
    }

    return { value: parsed };
};

// @desc    Store a cache entry
// @route   POST /cache
// @access  Public
exports.setCache = async (req, res, next) => {
    try {
        const { key, value, ttl } = req.body;

        if (typeof key !== 'string' || !key.trim()) {
            return res.status(400).json({ success: false, error: 'Key is required and must be a non-empty string' });
        }

        if (key.length > MAX_KEY_LENGTH) {
            return res.status(400).json({ success: false, error: `Key length must be <= ${MAX_KEY_LENGTH} characters` });
        }

        if (value === undefined) {
            return res.status(400).json({ success: false, error: 'Key and value are required' });
        }

        const ttlResult = parseTTL(ttl);
        if (ttlResult && ttlResult.error) {
            return res.status(400).json({ success: false, error: ttlResult.error });
        }

        const effectiveTTL = ttlResult ? ttlResult.value : null;

        await cacheService.set(key.trim(), value, effectiveTTL);

        res.status(201).json({
            success: true,
            message: 'Cache entry stored',
            data: { key: key.trim(), ttl: effectiveTTL || cacheService.ttl }
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
