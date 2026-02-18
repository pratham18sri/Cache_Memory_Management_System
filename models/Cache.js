const mongoose = require('mongoose');

const cacheSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    ttl: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // TTL index for auto-removal from DB
    }
}, { timestamps: true });

// Pre-save middleware to update expiresAt if not set (though logic should handle it)
cacheSchema.pre('save', function (next) {
    if (!this.expiresAt) {
        this.expiresAt = new Date(Date.now() + this.ttl * 1000);
    }
    next();
});

const Cache = mongoose.model('Cache', cacheSchema);

module.exports = Cache;
