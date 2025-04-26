const socketIo = require("socket.io");
const { HTTP_PORT } = require("../config/socketConfig");
const http = require("http");
const logger = require("../utils/logger");

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  global.io = io; // Make Socket.IO instance globally accessible

  io.on("connection", (socket) => {
    logger.info("New Socket.IO client connected.");

    socket.on("disconnect", () => {
      logger.info("Socket.IO client disconnected.");
    });
  });

  return io;
}

module.exports = initializeSocket;
