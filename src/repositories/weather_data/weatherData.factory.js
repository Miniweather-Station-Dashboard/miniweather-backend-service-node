const WeatherDataRepositoryScyllaDB = require("./weatherData.scylla.repository");

// Weather records live in Scylla (written by the Hyperbase ingest). Production
// runs Scylla only, so this path is intentionally Scylla-only — there is no
// PostgreSQL fallback for sensor records.
module.exports = WeatherDataRepositoryScyllaDB;