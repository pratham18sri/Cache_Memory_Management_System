const express = require('express');
const router = express.Router();
const {
    setCache,
    getCache,
    deleteCache,
    clearCache,
    getStats
} = require('../controllers/cacheController');

router.post('/', setCache);
router.get('/stats', getStats); // Order matters: stats before :key
router.get('/:key', getCache);
router.delete('/:key', deleteCache);
router.delete('/', clearCache);

module.exports = router;
