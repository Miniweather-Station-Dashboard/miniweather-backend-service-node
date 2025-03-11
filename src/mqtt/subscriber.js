const mqtt = require("mqtt");
const { MQTT_BROKER_URL, MQTT_TOPIC } = require("../config/mqttConfig");
const logger = require("../utils/logger");

const mqttSubscriber = mqtt.connect(MQTT_BROKER_URL);

mqttSubscriber.on("connect", () => {
  logger.info("Server subscriber connected to MQTT broker.");
  mqttSubscriber.subscribe(MQTT_TOPIC, (err) => {
    if (!err) {
      logger.info(`Subscribed to ${MQTT_TOPIC}`);
    }
  });
});

mqttSubscriber.on("message", (topic, message) => {
  logger.info(`Received MQTT message on ${topic}: ${message.toString()}`);
  global.io.emit("sensorData", message.toString()); // Emit message to Socket.IO clients
});

module.exports = { mqttSubscriber };
