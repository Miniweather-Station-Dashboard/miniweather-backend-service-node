const socketIo = require("socket.io");
const { HTTP_PORT } = require("../config/socketConfig");
const http = require("http");
const logger = require("../utils/logger");

function initializeSocket() {
  const httpServer = http.createServer();
  const io = socketIo(httpServer, {
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

  httpServer.listen(HTTP_PORT, () => {
    logger.info(`Socket.IO server running on port ${HTTP_PORT}`);
  });

  return io;
}

module.exports = initializeSocket;
