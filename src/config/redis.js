// config/redis.js
const Redis = require("ioredis");
require("dotenv").config(); // Load environment variables from .env file

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  db: parseInt(process.env.REDIS_DB || "0"),
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
});

redis.on("connect", () => {
  console.log("✅ Connected to Redis");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

module.exports = redis;
