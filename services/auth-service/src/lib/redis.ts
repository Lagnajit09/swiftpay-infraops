import { createClient, RedisClientType } from "redis";

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (client && client.isOpen) return client;

  client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  client.on("error", (err) => {
    console.error("❌ Redis client error:", err);
  });

  (async () => {
    try {
      await client.connect();
      console.log("✅ Connected to Redis at", process.env.REDIS_URL);
    } catch (err) {
      console.error("❌ Failed to connect to Redis:", err);
    }
  })();
  return client;
}
