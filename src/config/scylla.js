const cassandra = require("cassandra-driver");
const dotenv = require("dotenv");
dotenv.config();

const contactPoints = process.env.SCYLLA_CONTACT_POINTS?.split(",") || ["127.0.0.1"];
const localDataCenter = process.env.SCYLLA_LOCAL_DC || "datacenter1"; // fallback
const port = parseInt(process.env.SCYLLA_PORT, 10) || 9042;

const client = new cassandra.Client({
  contactPoints,
  localDataCenter,
  keyspace: process.env.SCYLLA_KEYSPACE,
  credentials: {
    username: process.env.SCYLLA_USERNAME,
    password: process.env.SCYLLA_PASSWORD,
  },
  protocolOptions: { port },
});

const checkScyllaConnection = async () => {
  try {
    await client.execute("SELECT now() FROM system.local");
    console.log("✅ ScyllaDB connected successfully");
  } catch (err) {
    console.error("❌ ScyllaDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = { client, checkScyllaConnection };
