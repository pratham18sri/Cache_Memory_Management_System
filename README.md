A production-ready Node.js + Express backend that implements a hybrid cache architecture — combining the microsecond read speed of in-memory storage with the durability and persistence of MongoDB.

Client Request
     │
     ▼
┌─────────────┐     HIT    ┌──────────────────┐
│   Express   │──────────► │  In-Memory Cache  │ ← Microsecond reads
│  REST API   │            │   (node-cache)    │
└─────────────┘            └──────────────────┘
     │                              │ MISS
     │                              ▼
     │                    ┌──────────────────┐
     └───────────────────►│     MongoDB      │ ← Persistent fallback
      Write-Through        │ (TTL Persistence)│
                          └──────────────────┘
Simple rule: Read from memory → fall back to DB → promote back to memory on hit. Write to both layers simultaneously.

💡 Why This Project?
Most simple cache demos have one fatal flaw: they lose all data when the server restarts.

This system solves that by:

Problem	Solution
Data lost on restart	Write-through persistence to MongoDB
Slow DB reads every time	In-memory layer serves repeated reads in microseconds
Stale data staying forever	TTL expiration in both memory and MongoDB
Memory bloat	Configurable max item limit in node-cache
Silent failures	Source tagging ("memory" vs "database") in every response
🏗️ Architecture Overview
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT / CONSUMER                        │
└─────────────────────────────┬──────────────────────────────────┘
                              │ HTTP Requests
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                       ROUTE LAYER                               │
│                    cacheRoutes.js                               │
│   POST /cache  ·  GET /cache/:key  ·  DELETE /cache/:key       │
│   DELETE /cache  ·  GET /cache/stats  ·  GET /health           │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                             │
│                  cacheController.js                             │
│   • Input validation (key length, ttl range)                   │
│   • Maps HTTP verbs to service methods                         │
│   • Formats success/error responses                            │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                               │
│                   cacheService.js                               │
│   • Core cache logic (get / set / delete / clear / stats)      │
│   • Memory-first reads with DB fallback                        │
│   • Write-through synchronization                              │
│   • Startup recovery from MongoDB                              │
└──────────────┬──────────────────────────────┬──────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────┐          ┌────────────────────────────┐
│   MEMORY LAYER       │          │     PERSISTENCE LAYER      │
│   (node-cache)       │          │   MongoDB + Mongoose        │
│                      │          │                            │
│  • O(1) key lookups  │          │  • Cache.js model          │
│  • Auto TTL eviction │          │  • TTL index on expiresAt  │
│  • Max items config  │          │  • Startup recovery query  │
│  • Hit/miss stats    │          │  • Cleanup job             │
└──────────────────────┘          └────────────────────────────┘
✨ Core Features
Feature	Description
Hybrid Cache	Memory-first reads, MongoDB as the durable fallback layer
Write-Through	Every write hits both in-memory and MongoDB simultaneously
Startup Recovery	On boot, valid (non-expired) DB entries restore into memory
TTL Expiration	Independent TTL enforcement in both layers
Source Tagging	Every GET response tells you if it came from memory or database
Cache Stats	Endpoint exposes hits, misses, key count, DB docs, and process memory
Health Check	/health reports uptime and MongoDB connectivity status
Graceful Shutdown	Clean HTTP + MongoDB closure on SIGTERM/SIGINT
Input Validation	Key (non-empty, max 128 chars) and TTL (1–2592000 seconds) validated
Cleanup Job	Periodic background job removes stale MongoDB documents
🛠️ Tech Stack
Layer	Technology	Purpose
Runtime	Node.js v18+	JavaScript runtime
Framework	Express.js 4.x	HTTP routing + middleware
Memory Cache	node-cache	Fast in-memory key-value store
Database	MongoDB 6.x	Persistent document storage
ODM	Mongoose	MongoDB schema + TTL index management
Config	dotenv	Environment variable management
📁 Project Structure
hybrid-cache/
│
├── config/
│   └── db.js                  # MongoDB connection setup & error handling
│
├── controllers/
│   └── cacheController.js     # HTTP request handlers + input validation
│
├── middleware/
│   └── errorMiddleware.js     # Global error handler + 404 catch-all
│
├── models/
│   └── Cache.js               # Mongoose schema: key, value, expiresAt, TTL index
│
├── routes/
│   └── cacheRoutes.js         # Express router — maps URLs to controller methods
│
├── services/
│   └── cacheService.js        # Core logic: get/set/delete/clear/stats/recovery
│
├── .env.example               # Template for environment variables
├── demonstration_guide.md     # Step-by-step demo walkthrough
├── MENTOR_GUIDE.md            # Mentor/reviewer presentation guide
├── server.js                  # Entry point: Express setup + startup + shutdown
└── README.md                  # You are here
File Responsibilities at a Glance
server.js
  └── imports config/db.js          → connects MongoDB
  └── imports routes/cacheRoutes.js → registers all endpoints
  └── handles startup recovery      → calls cacheService.recoverFromDB()
  └── handles graceful shutdown     → closes HTTP + Mongoose

routes/cacheRoutes.js
  └── delegates to controllers/cacheController.js

controllers/cacheController.js
  └── validates inputs
  └── calls services/cacheService.js

services/cacheService.js
  └── reads/writes node-cache (memory)
  └── reads/writes models/Cache.js (MongoDB)
🔄 How It Works
Write Flow (POST /cache)
Client POST { key, value, ttl }
        │
        ▼
Controller validates input
        │
        ▼
Service writes to node-cache  ──────────────► Memory updated ✓
        │
        ▼
Service writes to MongoDB     ──────────────► DB updated ✓
        │
        ▼
Response: { success: true, source: "write-through" }
Read Flow (GET /cache/:key)
Client GET /cache/:key
        │
        ▼
Service checks node-cache
        │
   HIT ─┤─ MISS
        │       │
        ▼       ▼
   Return    Query MongoDB
   memory      │
   value    FOUND ─┤─ NOT FOUND
               │           │
               ▼           ▼
          Promote to    Return 404
          memory
               │
               ▼
          Return value
          { source: "database" }
Startup Recovery Flow
Server boots
     │
     ▼
MongoDB connects
     │
     ▼
Query: find all where expiresAt > now()
     │
     ▼
For each valid document → write to node-cache with remaining TTL
     │
     ▼
Server starts accepting requests (memory now pre-warmed)
TTL Expiration
Memory layer:  node-cache auto-evicts keys when TTL expires
               (no manual intervention needed)

Database layer: MongoDB TTL index on `expiresAt` field
                MongoDB background thread deletes expired docs
                (typically within 60 seconds of expiry)
🚀 Local Setup
Prerequisites
Node.js v18 or higher
MongoDB running locally or a MongoDB Atlas URI
Step 1 — Clone and install
bash
git clone https://github.com/pratham18sri/hybrid-cache.git
cd hybrid-cache
npm install
Step 2 — Set up environment
bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
Step 3 — Configure .env
env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hybrid_cache
CACHE_TTL=300
CACHE_MAX_ITEMS=10000
Step 4 — Start the server
bash
# Development (with auto-restart)
npm run dev

# Production
npm start
Step 5 — Verify it's running
bash
curl http://localhost:5000/health
Expected response:

json
{
  "status": "ok",
  "uptime": 3.24,
  "database": "connected"
}
🔐 Environment Variables
Variable	Required	Default	Description
PORT	No	5000	Port the Express server listens on
MONGO_URI	Yes	—	MongoDB connection string
CACHE_TTL	No	300	Default TTL in seconds (5 minutes)
CACHE_MAX_ITEMS	No	10000	Max keys allowed in memory at once
⚠️ Never commit your .env file. It is already listed in .gitignore.

📡 API Reference
Base URL: http://localhost:5000

GET /health
Returns server uptime and database connectivity status.

Response:

json
{
  "status": "ok",
  "uptime": 42.5,
  "database": "connected"
}
POST /cache — Create or Update Entry
Request Body:

json
{
  "key": "user:123",
  "value": { "name": "Pratham", "role": "admin" },
  "ttl": 3600
}
Field	Type	Required	Constraints
key	string	✅ Yes	Non-empty, max 128 characters
value	any	✅ Yes	Any valid JSON
ttl	integer	❌ No	1 – 2,592,000 seconds (30 days max)
Response 201:

json
{
  "success": true,
  "key": "user:123",
  "ttl": 3600
}
GET /cache/:key — Read Entry
bash
GET /cache/user:123
Response 200 (memory hit):

json
{
  "key": "user:123",
  "value": { "name": "Pratham", "role": "admin" },
  "source": "memory"
}
Response 200 (database fallback):

json
{
  "key": "user:123",
  "value": { "name": "Pratham", "role": "admin" },
  "source": "database"
}
Response 404:

json
{
  "error": "Key not found or expired"
}
DELETE /cache/:key — Delete One Entry
bash
DELETE /cache/user:123
Response 200:

json
{
  "success": true,
  "key": "user:123",
  "deleted": true
}
DELETE /cache — Clear All Entries
bash
DELETE /cache
Response 200:

json
{
  "success": true,
  "message": "All cache entries cleared"
}
GET /cache/stats — Cache Statistics
bash
GET /cache/stats
Response 200:

json
{
  "memory": {
    "keys": 142,
    "hits": 5823,
    "misses": 47
  },
  "database": {
    "documents": 156
  },
  "process": {
    "heapUsedMB": 38.4,
    "heapTotalMB": 67.2
  }
}
HTTP Status Codes Summary
Code	Meaning
200	Success
201	Created
400	Validation error (bad key/ttl)
404	Key not found or expired
500	Internal server error
📊 Cache Flow Diagrams
Memory vs Database Hit Rate Over Time
Requests
    │                               ╭──────────────── memory hits
    │                          ╭────╯
    │                     ╭────╯
    │        ╭────────────╯
    │   ╭────╯
    └───┴─────────────────────────────────────────► Time
              ^
              Server starts / memory warms up from DB recovery
As the server runs, the memory hit rate increases as frequently accessed keys stay resident.

TTL Lifecycle
t=0         Write to memory + MongoDB
            │
            ├── node-cache TTL clock starts
            └── MongoDB expiresAt = now + ttl

t=ttl/2     GET request → served from memory (source: "memory")

t=ttl+ε     node-cache evicts key from memory automatically
            MongoDB background job deletes document
            Next GET → 404 (key not found or expired)
🛡️ Error Handling
The errorMiddleware.js provides two global handlers:

404 Handler — catches any route that doesn't match:

json
{
  "error": "Route not found",
  "path": "/cache/unknown/route"
}
Global Error Handler — catches thrown errors from controllers/services:

json
{
  "error": "Internal server error",
  "message": "Connection timeout"
}
All errors are logged to console with stack traces in development mode.

🔒 Reliability & Production Notes
Concern	How it's addressed
Server restart	MongoDB persistence + startup recovery pre-warms memory
Input abuse	Key max 128 chars, TTL max 30 days, validated before any write
Memory bloat	CACHE_MAX_ITEMS cap on node-cache prevents unbounded growth
Stale DB entries	MongoDB TTL index + periodic cleanup job auto-removes expired docs
Graceful shutdown	SIGTERM/SIGINT closes HTTP connections then Mongoose before exit
Startup failure	Errors during DB connect or recovery are caught, logged, and crash loudly
Response transparency	source field on every GET tells consumers where data came from
🔮 Future Enhancements
 Auth & Authorization — API key middleware or JWT-based access control
 Rate Limiting — express-rate-limit to prevent abuse per IP/key
 Test Suite — Jest + Supertest unit and integration tests for all layers
 Structured Logging — Replace console.log with winston or pino
 Docker Support — Dockerfile + docker-compose.yml for one-command startup
 Redis Adapter — Swap node-cache for Redis for distributed/multi-instance cache
 Cache Namespacing — Group keys by prefix for bulk operations
 Metrics Endpoint — Prometheus-compatible /metrics for Grafana dashboards
 Swagger Docs — Auto-generated OpenAPI spec via swagger-jsdoc
 Cache Warming — Seed known keys at startup from a config file
📚 Documentation
File	Purpose
README.md	Project overview, setup, API reference (this file)
demonstration_guide.md	Step-by-step walkthrough for running a live demo
MENTOR_GUIDE.md	Reviewer/mentor guide explaining design decisions
.env.example	Template with all supported environment variables