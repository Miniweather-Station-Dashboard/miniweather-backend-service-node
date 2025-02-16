const net = require("net");

// Create a server to listen for incoming connections
const server = net.createServer((socket) => {
  console.log("New connection established.");

  // Event listener for data received from the client
  socket.on("data", (data) => {
    console.log(`Received data: ${data.toString()}`);
  });

  // Handle socket errors
  socket.on("error", (err) => {
    console.error(`Socket error: ${err.message}`);
  });

  // Handle socket closure
  socket.on("close", () => {
    console.log("Connection closed.");
  });
});

// Start the server and listen on port 8080
const PORT = 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
