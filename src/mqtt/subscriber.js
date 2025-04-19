const mqtt = require("mqtt");
const { MQTT_BROKER_URL, MQTT_TOPIC, MQTT_HYPERBASE_TOPIC } = require("../config/mqttConfig");
const logger = require("../utils/logger");

const { publishMessage } = require("./publisher");

// Use the MQTT broker URL as in your original code
const mqttSubscriber = mqtt.connect(MQTT_BROKER_URL);

mqttSubscriber.on("connect", () => {
  logger.info("==> MQTT connected");

  // Subscribe to the MQTT topic
  mqttSubscriber.subscribe(MQTT_TOPIC, (err) => {
    if (!err) {
      logger.info(`==> Subscribed to ${MQTT_TOPIC}`);
    } else {
      logger.error(`==> Error subscribing to ${MQTT_TOPIC}: ${err.message}`);
    }
  });
});

mqttSubscriber.on("message", (topic, message) => {
  logger.info(`Received message from ${topic}: ${message.toString()}`);
  publishMessage(MQTT_HYPERBASE_TOPIC, message); // Publish the message to the MQTT topic
  // Publish the message to the MQTT topic
  global.io.emit("sensorData", message.toString()); // Emit message to Socket.IO clients
});

mqttSubscriber.on("close", () => {
  logger.info("==> MQTT connection closed");
});

mqttSubscriber.on("error", (err) => {
  logger.error("==> MQTT error:", err);
});

module.exports = { mqttSubscriber };
