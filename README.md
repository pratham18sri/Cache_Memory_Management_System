# Hybrid Cache System

A production-ready Hybrid Cache System backend using Node.js, Express, and MongoDB. It combines fast in-memory caching with persistent storage, ensuring data survives server restarts.

## Features

- **Hybrid Caching**: Fast in-memory access (LRU) + MongoDB persistence.
- **Persistence**: Cache entries survive server restarts.
- **Auto-Sync**: Writes are synchronized to both memory and DB.
- **Automatic Eviction**: TTL-based expiry (Memory & DB).
- **Graceful Shutdown**: Ensures data integrity on exit.
- **Statistics**: Monitor cache hits, misses, and memory usage.

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- node-cache
- dotenv

## Installation

1.  **Clone the repository** (or extract files).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    CACHE_TTL=300
    CACHE_MAX_ITEMS=10000
    ```
4.  **Start the Server**:
    - Development: `npm run dev`
    - Production: `npm start`

## API Endpoints

### Store Cache Entry
**POST** `/cache`
```json
{
  "key": "user:123",
  "value": { "name": "John Doe", "role": "admin" },
  "ttl": 3600
}
```

### Retrieve Cache Entry
**GET** `/cache/:key`
- Returns cached data.
- Source field indicates `memory` or `database`.

### Delete Cache Entry
**DELETE** `/cache/:key`

### Clear All Cache
**DELETE** `/cache`

### Get Statistics
**GET** `/cache/stats`
- Returns memory usage, key counts, hits/misses.

## Folder Structure

- `config/`: Database configuration
- `controllers/`: API request handlers
- `models/`: Mongoose schemas
- `routes/`: API route definitions
- `services/`: Core caching logic (Hybrid Cache Service)
- `middleware/`: Error handling and logging
- `server.js`: Application entry point

## Persistence Strategy

- **Writes**: Data is written to `node-cache` (RAM) and `MongoDB` simultaneously.
- **Reads**: 
    1. Check RAM. If found -> Return (Fast).
    2. If not in RAM -> Check MongoDB.
    3. If in MongoDB -> Load to RAM -> Return.
- **Eviction**:
    - RAM: Handled by `node-cache` TTL/LRU.
    - DB: Handled by MongoDB TTL index (`expiresAt`).
- **Restart**: On startup, valid entries are loaded from MongoDB into RAM (up to `CACHE_MAX_ITEMS`).
