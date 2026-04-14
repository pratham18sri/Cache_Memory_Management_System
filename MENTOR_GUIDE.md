# Mentor Guide: How To Present This Project End-to-End

Use this as your speaking script for a mentor presentation, viva, or review.

## 1) Opening (30-45 seconds)

Say this:

"My project is a Hybrid Cache Memory Management System built with Node.js, Express, and MongoDB. The goal is to solve a common cache problem: in-memory cache is fast, but it loses data when the server restarts. I solved that by combining memory speed with MongoDB persistence."

## 2) Problem Statement (45-60 seconds)

Say this:

"A normal in-memory cache gives low latency, but after restart all keys are lost. For real systems, that causes cold starts and repeated database load. I implemented a hybrid approach where reads are fast from memory, but data is also stored in MongoDB and recovered after restart."

Key points to emphasize:
- Speed from RAM
- Durability from database
- Automatic expiration (TTL)
- Startup restoration

## 3) Architecture Explanation (1-2 minutes)

Say this:

"The architecture has route, controller, service, memory, and database layers. Controllers validate request data. The service is the core engine: it writes to both memory and MongoDB, reads from memory first, and falls back to database on miss. If data is found in DB, it is promoted back into memory."

Flow to explain:
1. Client -> Express route
2. Controller validates key/value/ttl
3. Service performs cache logic
4. Memory hit returns immediately
5. Memory miss checks MongoDB
6. DB hit is promoted to memory
7. Response returns with source

## 4) Start-to-End Demo Script (5-7 minutes)

### Step A: Start and Health Check
1. Run `npm run dev`
2. Call `GET /health`
3. Explain: "Service is up and database connection is verified."

### Step B: Store Data
1. Call `POST /cache` with key `demo_user`, value object, ttl `300`
2. Explain: "This write goes to memory and MongoDB together (write-through)."

### Step C: Fast Read
1. Call `GET /cache/demo_user`
2. Explain: "Source should be memory, showing fast retrieval."

### Step D: Restart Persistence Proof
1. Stop server (Ctrl + C)
2. Start server again (`npm run dev`)
3. Call `GET /cache/demo_user`
4. Explain: "Data survived restart due to MongoDB persistence and startup restore."

### Step E: Stats and Observability
1. Call `GET /cache/stats`
2. Explain hits, misses, key counts, and memory usage.

### Step F: TTL Expiration
1. `POST /cache` key `short_lived`, ttl `5`
2. Immediate `GET` returns data
3. Wait >5 seconds and call `GET` again
4. Explain: "Entry expired automatically."

## 5) Closing Statement (20-30 seconds)

Say this:

"In summary, this project demonstrates a practical hybrid cache: low latency from memory, reliability from MongoDB, automatic TTL cleanup, and production-friendly health and shutdown handling."

## 6) Most Important Code Lines (Show These in Editor)

These are the lines you should open and explain during presentation.

### A) Health and readiness endpoint
- File: `server.js` line 21
- Code role: proves service and DB readiness.

### B) Startup restore from persistent DB
- File: `server.js` line 49 (`await cacheService.init()`)
- Code role: loads valid DB cache entries into memory on startup.

### C) Graceful shutdown
- File: `server.js` line 63 (`const shutdown = async () => { ... }`)
- Code role: avoids abrupt stop, closes server and DB cleanly.

### D) Input validation guardrails
- File: `controllers/cacheController.js` lines 3-6
- Code role: defines limits (`MAX_KEY_LENGTH`, `MAX_TTL_SECONDS`, `parseTTL`).

- File: `controllers/cacheController.js` lines 30-31
- Code role: blocks oversized keys.

- File: `controllers/cacheController.js` line 38
- Code role: enforces valid TTL before write.

### E) Write-through persistence (core hybrid logic)
- File: `services/cacheService.js` line 71 (`Cache.findOneAndUpdate`)
- Code role: keeps MongoDB synchronized with memory writes.

### F) Read source transparency (memory vs database)
- File: `services/cacheService.js` line 100 (`source: 'memory'`)
- File: `services/cacheService.js` line 117 (`source: 'database'`)
- Code role: proves where response data came from.

### G) Startup DB scan and memory repopulation
- File: `services/cacheService.js` line 34 (find valid unexpired docs)
- File: `services/cacheService.js` line 42 (reinsert in-memory with remaining TTL)
- Code role: restart resilience and warm cache behavior.

### H) Database TTL auto-expiry index
- File: `models/Cache.js` line 29 (`expireAfterSeconds: 0`)
- Code role: auto-removes expired records from MongoDB.

### I) Safe DB configuration checks
- File: `config/db.js` line 6 (throws if `MONGO_URI` missing)
- File: `config/db.js` line 9 (MongoDB connection call)
- Code role: fail-fast startup and reliable DB initialization.

## 7) Mentor Q&A Quick Answers

Q: Why not only use Redis?
A: Redis is excellent, but this project demonstrates hybrid design principles with minimal infra while still preserving durability using MongoDB.

Q: How is data not lost on restart?
A: Writes are persisted in MongoDB and restored into memory during startup.

Q: How do you prevent invalid cache entries?
A: Controller validation enforces key quality and TTL bounds.

Q: How is expiration handled?
A: node-cache handles in-memory TTL and MongoDB TTL index handles DB cleanup.

Q: What production features are already present?
A: Health endpoint, graceful shutdown, input validation, cleanup safety job, and stats endpoint.

## 8) If Mentor Asks For Improvements

Mention these next steps:
- Add auth and rate limiting
- Add unit and integration tests
- Add structured logging and tracing
- Add Docker support
- Add Redis adapter for distributed workloads
