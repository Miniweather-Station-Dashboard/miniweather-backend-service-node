const WeatherDataRepositoryPostgreSQL = require("./weatherData.postgre.repository");
const WeatherDataRepositoryScyllaDB = require("./weatherData.scylla.repository");

function getWeatherDataRepository() {
  const dbType = process.env.DB_TYPE || "postgres"; // Default to postgres

  if (dbType === "scylla") {
    return WeatherDataRepositoryScyllaDB;
  } else {
    return WeatherDataRepositoryPostgreSQL;
  }
}

module.exports = getWeatherDataRepository();