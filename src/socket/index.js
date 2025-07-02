const socketIo = require("socket.io");
const logger = require("../utils/logger");
const { checkHyperbaseStatus } = require("../config/hyperbaseStatus");

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

 setInterval(async () => {
    const isOnline = await checkHyperbaseStatus();

    io.emit("hyperbase_status", {
      status: isOnline ? "online" : "offline",
      timestamp: new Date().toISOString(),
    });
  }, 3000);

  return io;
}

module.exports = initializeSocket;
