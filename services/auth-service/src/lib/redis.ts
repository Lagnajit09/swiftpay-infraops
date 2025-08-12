// src/lib/redis.ts
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis at", redisUrl);
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err);
  }
})();
