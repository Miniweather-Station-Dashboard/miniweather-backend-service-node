const mqtt = require("mqtt");
const {
  MQTT_BROKER_URL,
  MQTT_HYPERBASE_TOPIC,
} = require("../config/mqttConfig");
const logger = require("../utils/logger");
const { pool } = require("../config/db");
const { publishMessage } = require("./publisher");

// Track active subscriptions
const activeSubscriptions = new Set();
const mqttSubscriber = mqtt.connect(MQTT_BROKER_URL);

const project_id = process.env.HYPERBASE_PROJECT_ID
const token_id = process.env.HYPERBASE_TOKEN_ID

// Initialize MQTT connection and subscriptions
const initializeSubscriptions = async () => {
  try {
    const result = await pool.query(
      "SELECT id FROM onboarding_devices WHERE status = 'active'"
    );

    for (const { id } of result.rows) {
      await subscribeToDevice(id);
    }
  } catch (err) {
    logger.error("Error initializing subscriptions:", err);
  }
};

// Subscribe to a device topic
const subscribeToDevice = async (deviceId) => {
  const topic = `/devices/${deviceId}`;

  return new Promise((resolve, reject) => {
    if (activeSubscriptions.has(topic)) {
      return resolve();
    }

    mqttSubscriber.subscribe(topic, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to ${topic}: ${err.message}`);
        reject(err);
      } else {
        logger.info(`Subscribed to device topic ${topic}`);
        activeSubscriptions.add(topic);
        resolve();
      }
    });
  });
};

// Unsubscribe from a device topic
const unsubscribeFromDevice = async (deviceId) => {
  const topic = `/devices/${deviceId}`;

  return new Promise((resolve, reject) => {
    if (!activeSubscriptions.has(topic)) {
      return resolve();
    }

    mqttSubscriber.unsubscribe(topic, (err) => {
      if (err) {
        logger.error(`Failed to unsubscribe from ${topic}: ${err.message}`);
        reject(err);
      } else {
        logger.info(`Unsubscribed from device topic ${topic}`);
        activeSubscriptions.delete(topic);
        resolve();
      }
    });
  });
};

mqttSubscriber.on("message", (topic, message) => {
  try {
    const collection_id = topic.split("/")[2];
    publishMessage(MQTT_HYPERBASE_TOPIC, message, project_id, token_id, collection_id);
    console.log("MQTT message received:", topic, message.toString());

    if (global.io) {
      global.io.emit(topic, message.toString());
    }
  } catch (err) {
    console.log("Error processing MQTT message:", err);
    logger.error("Error processing MQTT message:", err);
  }
});

mqttSubscriber.on("connect", () => {
  logger.info("MQTT connected");
  initializeSubscriptions();
});

mqttSubscriber.on("close", () => {
  logger.info("MQTT connection closed");
  activeSubscriptions.clear();
});

mqttSubscriber.on("error", (err) => {
  logger.error("MQTT error:", err);
});

module.exports = {
  mqttSubscriber,
  subscribeToDevice,
  unsubscribeFromDevice,
  initializeSubscriptions,
};
