const aedes = require("aedes")();
const net = require("net");

// Create the MQTT broker on port 1883
const PORT = 1883;
const server = net.createServer(aedes.handle);
server.listen(PORT, () => {
  console.log(`Aedes MQTT Broker running on port ${PORT}`);
});

// Log when a client connects
aedes.on("client", (client) => {
  console.log(`Client connected: ${client.id}`);
});

// Log messages published to the broker
aedes.on("publish", (packet, client) => {
  if (client) {
    console.log(`Message from ${client.id}: ${packet.payload.toString()}`);
  }
});

// Optional: Subscribe to the topic "sensors/temperature" to process data
const mqtt = require("mqtt");
const subscriber = mqtt.connect("mqtt://localhost:1883");

subscriber.on("connect", () => {
  console.log("Server subscriber connected to MQTT broker.");
  subscriber.subscribe("sensors/temperature", (err) => {
    if (!err) {
      console.log("Subscribed to sensors/temperature");
    }
  });
});

subscriber.on("message", (topic, message) => {
  console.log(`Received message on ${topic}: ${message.toString()}`);
});
