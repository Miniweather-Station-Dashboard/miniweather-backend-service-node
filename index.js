const aedes = require("aedes")();
const net = require("net");
const http = require("http");
const mqtt = require("mqtt");
const socketIo = require("socket.io");

// Create the MQTT broker
const MQTT_PORT = 1883;
const mqttServer = net.createServer(aedes.handle);
mqttServer.listen(MQTT_PORT, () => {
  console.log(`Aedes MQTT Broker running on port ${MQTT_PORT}`);
});

// Create an HTTP server for Socket.IO
const HTTP_PORT = 3000;
const httpServer = http.createServer();
const io = socketIo(httpServer, {
  cors: {
    origin: "*", // Allow all origins (you can restrict it to specific origins if needed)
    methods: ["GET", "POST"], // Allow GET and POST methods
  },
});

// Start the Socket.IO server
httpServer.listen(HTTP_PORT, () => {
  console.log(`Socket.IO server running on port ${HTTP_PORT}`);
});

// Log MQTT client connections
aedes.on("client", (client) => {
  console.log(`MQTT client connected: ${client.id}`);
});

// Subscribe to the MQTT topic using an internal subscriber
const mqttSubscriber = mqtt.connect("mqtt://localhost:1883");

mqttSubscriber.on("connect", () => {
  console.log("Server subscriber connected to MQTT broker.");
  mqttSubscriber.subscribe("sensors/weather", (err) => {
    if (!err) {
      console.log("Subscribed to sensors/weather");
    }
  });
});

// Forward MQTT messages to Socket.IO clients
mqttSubscriber.on("message", (topic, message) => {
  console.log(`Received MQTT message on ${topic}: ${message.toString()}`);

  // Process the data (you can modify it as needed here)
  const processedData = `Processed: ${message.toString()}`;

  // Emit the processed data to all connected Socket.IO clients
  io.emit("sensorData", message);
  console.log(`Sent data to Socket.IO clients: ${processedData}`);
});

// Handle new Socket.IO client connections
io.on("connection", (socket) => {
  console.log("New Socket.IO client connected.");

  socket.on("disconnect", () => {
    console.log("Socket.IO client disconnected.");
  });
});
