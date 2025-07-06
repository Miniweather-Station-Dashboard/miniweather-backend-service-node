const redisClient = require("../config/redis");
const { publishMessage } = require("../mqtt/publisher");
const { getHyperbaseStatus } = require("../socket/index");

async function flushBufferedMessages() {
    if (!getHyperbaseStatus()) return;
    console.log("🔄 Flushing buffered messages...");

  const keys = await redisClient.keys("buffer:*");
  for (const key of keys) {
    try {
      const data = await redisClient.get(key);
      if (!data) {
        console.warn(`No data found for key: ${key}`);
        continue;
      }
      ;
      const { topic, message, deviceId } = JSON.parse(data);

      await publishMessage(
        process.env.MQTT_HYPERBASE_TOPIC,
        message,
        process.env.HYPERBASE_PROJECT_ID,
        process.env.HYPERBASE_TOKEN_ID,
        deviceId
      );

      await redisClient.del(key);
      console.log(`✅ Flushed data for key: ${key}, topic: ${topic}, deviceId: ${deviceId}, message: ${JSON.stringify(message)}`);
    } catch (err) {
      console.error(`❌ Error flushing ${key}:`, err.message);
    }
  }
}

setInterval(flushBufferedMessages, 10000);
