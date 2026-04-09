⚡ Hybrid Cache System (HCS)

Blazing fast ⚡ ·
Persistent 💾 · 
Scalable 🚀

A production-grade hybrid caching backend engineered for high performance, fault tolerance, and reliability, combining in-memory speed with 
database persistence.

🧠 Architecture Overview

Client

   │
   
   ▼

Express API

   │
   
   ▼

Hybrid Cache Core

   │

   ├── In-Memory Cache (node-cache ⚡)

   │

   └── MongoDB (Persistence 💾)

🚀 Core Features

⚡ Hybrid Caching Engine

Ultra-fast in-memory access (node-cache)

Persistent MongoDB backup layer

💾 Zero Data Loss (Persistence Layer)

Survives crashes, restarts, and deployments

Ensures durability of cached data

🔄 Auto Sync Layer

Writes propagate simultaneously to:

RAM (fast access)

MongoDB (persistent storage)

⏳ Smart TTL Eviction

Memory Layer → TTL + LRU eviction

Database Layer → MongoDB TTL index (expiresAt)

🧯 Graceful Shutdown Protocol

Prevents cache corruption

Ensures safe shutdown and state consistency

📊 Observability

Real-time metrics:

Cache hits & misses

Memory usage

Total keys

🛠️ Tech Stack

Layer	Technology

Backend	Node.js + Express

Database	MongoDB (Mongoose ODM)

Caching	node-cache (TTL + LRU)

Config	dotenv

⚙️ Setup & Installation

1️⃣ Clone Repository

git clone <repo-url>

cd hybrid-cache-system

npm install

2️⃣ Environment Configuration

Create a .env file:

PORT=5000

MONGO_URI=your_mongodb_connection_string

CACHE_TTL=300

CACHE_MAX_ITEMS=10000

3️⃣ Run Server

Development

npm run dev

Production

npm start

🔌 API Endpoints

➕ Store Cache

POST /cache

Body:
{
  "key": "user:123",

  "value": {  
    "name": "John Doe",
    "role": "admin"
  },
  "ttl": 3600
}


🔍 Retrieve Cache

GET /cache/:key

Response Sources:

⚡ Memory (fast path)

💾 Database (fallback)

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

├── config/        # Database configuration

├── controllers/   # Route handlers

├── models/        # Mongoose schemas

├── routes/        # API routes

├── services/      # Core cache engine 🔥

├── middleware/    # Logging & error handling

├── server.js      # Entry point

⚙️ Cache Strategy (Deep Dive)

📝 Write Path

Client → API → Cache Service

             ├── RAM (node-cache)
             
             └── MongoDB
📖 Read Path


1. Check RAM ⚡

2. If miss → Check MongoDB 💾

3. If found → Hydrate RAM → Return

🧹 Eviction Policy

Memory: TTL + LRU

Database: TTL Index (expiresAt)

🔁 Restart Recovery

On server startup:

Fetch valid entries from MongoDB

Load into memory (bounded by CACHE_MAX_ITEMS)

🧑‍💻 Team

Team Name: PRx Core Engineers ⚡

👑 Prakhar — System Architect

⚙️ Pratham — Backend Engineer

🔧 Prashant — API & Integration

🧠 Praveen — Database & Optimization

🚀 Prasann — Performance & Testing

📌 Highlights

Production-ready architecture

Fault-tolerant caching system

Optimized read/write performance

Scalable and modular design





