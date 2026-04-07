⚡ HYBRID CACHE SYSTEM (HCS)

Blazing fast ⚡ + Persistent 💾 + Scalable 🚀
A production-grade hybrid caching backend engineered for speed, reliability, and fault tolerance.

🧠 Architecture Overview
           ┌──────────────┐
           │   Client     │
           └──────┬───────┘
                  │
          ┌───────▼────────┐
          │   Express API   │
          └───────┬────────┘
                  │
        ┌─────────▼─────────┐
        │ Hybrid Cache Core │
        └───────┬───────────┘
                │
     ┌──────────▼──────────┐
     │   In-Memory Cache   │  (node-cache ⚡)
     └──────────┬──────────┘
                │
     ┌──────────▼──────────┐
     │     MongoDB         │  (Persistence 💾)
     └─────────────────────┘
🚀 Core Features
⚡ Hybrid Caching Engine
Ultra-fast in-memory access + persistent MongoDB backup
💾 Zero Data Loss (Z0Persistence)
Survives crashes, restarts, and deployments
🔄 Auto Sync Layer
Writes propagate instantly → RAM + DB
⏳ Smart TTL Eviction
Memory → LRU + TTL
DB → Mongo TTL Index
🧯 Graceful Shutdown Protocol
Ensures no cache corruption
📊 Observability
Real-time stats: hits, misses, memory usage
🛠️ Tech Stack
Backend   → Node.js + Express
Database  → MongoDB (Mongoose ODM)
Caching   → node-cache (LRU + TTL)
Env Mgmt  → dotenv
⚙️ Setup & Installation
1️⃣ Clone & Install
git clone <repo-url>
cd hybrid-cache-system
npm install
2️⃣ Environment Config

Create .env:

PORT=5000
MONGO_URI=your_mongodb_connection_string
CACHE_TTL=300
CACHE_MAX_ITEMS=10000
3️⃣ Run Server
# Dev mode
npm run dev

# Production
npm start
🔌 API Endpoints
➕ Store Cache
POST /cache
{
  "key": "user:123",
  "value": { "name": "John Doe", "role": "admin" },
  "ttl": 3600
}
🔍 Retrieve Cache
GET /cache/:key

⚡ Returns:

memory (fast path)
database (fallback path)
❌ Delete Entry
DELETE /cache/:key
🧹 Clear Cache
DELETE /cache
📊 Cache Stats
GET /cache/stats

Returns:

Hit/Miss ratio
Memory usage
Total keys
🗂️ Project Structure
├── config/        # DB configs
├── controllers/   # Route handlers
├── models/        # Mongoose schemas
├── routes/        # API routes
├── services/      # Core cache engine 🔥
├── middleware/    # Error/logging
├── server.js      # Entry point
⚙️ Cache Strategy (Deep Dive)
📝 Write Path
Client → API → Cache Service
                ├── RAM (node-cache)
                └── MongoDB
📖 Read Path
1. Check RAM ⚡
2. Miss → Check MongoDB 💾
3. Found → Hydrate RAM → Return
🧹 Eviction Policy
Memory → TTL + LRU
Database → TTL Index (expiresAt)
🔁 Restart Recovery
On Boot:
→ Fetch valid DB entries
→ Load into RAM (bounded by CACHE_MAX_ITEMS)
🧑‍💻 Team
Team Name: PRx Core Engineers ⚡
👑 Pratham — Team Lead / System Architect
⚙️ Prakher — Backend Engineer
🔧 Prashant — API & Integration
🧠 Praveen — Database & Optimization
🚀 Prasann — Performance & Testing
