const WebSocket = require('ws');
const { WS_URL } = require("../config/wsConfig");  
const logger = require("../utils/logger");

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    logger.info("✅ WebSocket connected");
});

ws.on('message', (data) => {
    logger.info(` Message from server: ${data.toString()}`);
    global.io.emit("sensorData", data.toString()); 
});

ws.on('close', () => {
    logger.info(" WebSocket closed");
});

ws.on('error', (err) => {
    console.log(err)
    logger.error(" WebSocket error:", err);
});

module.exports = { ws };
