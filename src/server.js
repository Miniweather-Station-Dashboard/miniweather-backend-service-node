require("dotenv").config();
const initializeSocket = require("../src/socket");
// const { aedes } = require("../src/mqtt/broker");
const { mqttSubscriber } = require("../src/mqtt/subscriber");
// const {ws} = require("./websocket/subscriber")

initializeSocket();