const mqtt = require("mqtt");
const { MQTT_BROKER_URL } = require("../config/mqttConfig");
const logger = require("../utils/logger");

const mqttPublisher = mqtt.connect(MQTT_BROKER_URL);

mqttPublisher.on("connect", () => {
  logger.info("==> MQTT Publisher connected");
});

mqttPublisher.on("error", (err) => {
  logger.error("==> MQTT Publisher error:", err);
});

/**
 * Publishes a buffer message to the given topic after converting to JSON and enriching.
 * @param {string} topic - The MQTT topic.
 * @param {Buffer} messageBuffer - The message payload as a Buffer.
 * @param {string} project_id - The project ID to attach.
 * @param {string} token_id - The token ID to attach.
 * @param {string} collection_id - The collection ID to attach.
 */
function publishMessage(topic, messageBuffer, project_id, token_id, collection_id) {
  if (!mqttPublisher.connected) {
    logger.warn("==> MQTT Publisher not connected. Message not sent.");
    return;
  }

  try {
    const parsed = JSON.parse(messageBuffer.toString());

    const enrichedMessage = {
      ...parsed,
      project_id,
      token_id,
      collection_id,
    };

    const finalMessage = JSON.stringify(enrichedMessage);

    // Debug log — consider removing or throttling in production
    // console.log(`==> Publishing to ${topic}:`, finalMessage);

    mqttPublisher.publish(topic, finalMessage);
  } catch (err) {
    logger.error("==> Failed to parse or publish message:", err);
  }
}

module.exports = {
  publishMessage,
};
