const mqtt = require("mqtt");
const { MQTT_BROKER_URL } = require("../config/mqttConfig");
const logger = require("../utils/logger");

// Create a separate MQTT client for publishing
const mqttPublisher = mqtt.connect(MQTT_BROKER_URL);

mqttPublisher.on("connect", () => {
  logger.info("==> MQTT Publisher connected");
});

mqttPublisher.on("error", (err) => {
  logger.error("==> MQTT Publisher error:", err);
});

/**
 * Publishes a message to the given topic.
 * @param {string} topic - The MQTT topic.
 * @param {string|Buffer} message - The message to publish.
 */
function publishMessage(topic, message) {
  if (mqttPublisher.connected) {
    mqttPublisher.publish(topic, message, (err) => {
      if (err) {
        logger.error(`==> Failed to publish to ${topic}:`, err);
      } else {
        logger.info(`Published to ${topic}: ${message}`);
      }
    });
  } else {
    logger.warn("==> MQTT Publisher not connected. Message not sent.");
  }
}

module.exports = {
  publishMessage,
};
