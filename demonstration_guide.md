# Project Demonstration Guide

Use this guide to demonstrate the **Hybrid Cache System** to your mentor using **Thunder Client** (or Postman).

## 🚀 Setup
1.  Make sure your server is running in the terminal:
    ```bash
    npm run dev
    ```
    *(You should see "Server running on port 5000" and "MongoDB Connected")*

## 🧪 Demonstration Steps

### Step 1: Store Data (Cache Hit)
**Goal:** Show that data is saved to both Memory and MongoDB.

1.  **Method:** `POST`
2.  **URL:** `http://localhost:5000/cache`
3.  **Body (JSON):**
    ```json
    {
      "key": "demo_user",
      "value": { "name": "Alice", "role": "Mentor" },
      "ttl": 300
    }
    ```
4.  **Click Send**.
5.  **Response:** Status `201 Created`.
    ```json
    {
      "success": true,
      "message": "Cache entry stored",
      ...
    }
    ```

### Step 2: Retrieve Data (Fast Access)
**Goal:** Show fast retrieval from Memory.

1.  **Method:** `GET`
2.  **URL:** `http://localhost:5000/cache/demo_user`
3.  **Click Send**.
4.  **Response:** Status `200 OK`.
    *   **Note the field:** `"source": "memory"`
    *   *Explain:* "This data came directly from RAM, making it super fast."

### Step 3: Demonstrate Persistence (Crucial!)
**Goal:** Show that data survives a server restart (unlike standard cache).

1.  **Stop the Server**: Click in your terminal and press `Ctrl + C`.
2.  **Restart the Server**: Run `npm run dev`.
3.  **Wait** for "MongoDB Connected".
4.  **Go back to Thunder Client**.
5.  **Method:** `GET`
6.  **URL:** `http://localhost:5000/cache/demo_user`
7.  **Click Send**.
8.  **Response:** Status `200 OK`.
    *   **Look closely:** You might see `"source": "memory"` (because it autoloaded on start) OR `"source": "database"` (if it was fetched on demand).
    *   *Explain:* "Even though I restarted the server, the data wasn't lost. It was recovered from MongoDB."

### Step 4: Cache Statistics
**Goal:** Show monitoring capabilities.

1.  **Method:** `GET`
2.  **URL:** `http://localhost:5000/cache/stats`
3.  **Response:**
    *   Shows `memory.keys` (items in RAM).
    *   Shows `database.count` (items in DB).
    *   *Explain:* "This endpoint lets us monitor the health and usage of our cache system."

### Step 5: Data Expiry (TTL)
**Goal:** Show automatic cleanup.

1.  **Method:** `POST`
2.  **URL:** `http://localhost:5000/cache`
3.  **Body (JSON):**
    ```json
    {
      "key": "quick_data",
      "value": "I vanish fast",
      "ttl": 5
    }
    ```
    *(Sets a 5-second lifespan)*
4.  **Quickly GET** `http://localhost:5000/cache/quick_data` -> Returns Data.
5.  **Wait 6 seconds**.
6.  **GET** `http://localhost:5000/cache/quick_data` -> Returns `404 Cache miss`.
    *   *Explain:* " The system automatically removed the expired data to free up memory."

---
**Why this is impressive:**
Most simple cache projects lose all data on restart. Yours is **Hybrid**—it combines the speed of Redis (Memory) with the reliability of a Database (MongoDB).
