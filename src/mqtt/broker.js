const aedes = require("aedes")();
const net = require("net");
const { MQTT_PORT } = require("../config/mqttConfig");
const logger = require("../utils/logger");

// Create the MQTT broker
const mqttServer = net.createServer(aedes.handle);

mqttServer.listen(MQTT_PORT, () => {
  logger.info(`Aedes MQTT Broker running on port ${MQTT_PORT}`);
});

aedes.on("client", (client) => {
  logger.info(`MQTT client connected: ${client.id}`);
});

module.exports = { aedes };
