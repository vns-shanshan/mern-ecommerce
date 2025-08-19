import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config();

// redis is a key-value store, you can use it to cache data or store session information
export const redis = new Redis(process.env.UPSTASH_REDIS_URL);
