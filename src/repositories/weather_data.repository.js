const { pool } = require("../config/db");

class WeatherDataRepository {
  /**
   * Get minute-by-minute averages of weather data within a time range
   * @param {Object} options - Query options
   * @param {Date} options.startTime - Start of time range
   * @param {Date} options.endTime - End of time range
   * @param {string} [options.timezone='UTC'] - Timezone for grouping
   * @returns {Promise<Array>} Array of minute-averaged records
   */
  async getMinuteAverages({ startTime, endTime, timezone = "UTC" }) {
    const query = {
      text: `
        SELECT
          date_trunc('minute', _updated_at AT TIME ZONE $3) as minute,
          AVG(pressure) as avg_pressure,
          AVG(wind_speed) as avg_wind_speed,
          AVG(temperature) as avg_temperature,
          AVG(rainfall) as avg_rainfall
        FROM records_01961f7aea7876039c5d2d1097af7819
        WHERE _updated_at BETWEEN $1 AND $2
        GROUP BY minute
        ORDER BY minute ASC
      `,
      values: [startTime, endTime, timezone],
    };

    const res = await pool.query(query);
    return res.rows;
  }

  /**
   * Get weather data within a time range
   * @param {Object} options - Query options
   * @param {Date} options.startTime - Start of time range
   * @param {Date} options.endTime - End of time range
   * @param {number} [options.limit=1000] - Maximum number of records to return
   * @returns {Promise<Array>} Array of raw records
   */
  async getDataInTimeRange({ startTime, endTime, limit = 1000 }) {
    const query = {
      text: `
        SELECT *
        FROM records_01959f37704b7c3284133d4637c0337c
        WHERE _updated_at BETWEEN $1 AND $2
        ORDER BY _updated_at ASC
        LIMIT $3
      `,
      values: [startTime, endTime, limit],
    };

    const res = await pool.query(query);
    return res.rows;
  }

  /**
   * Create a new weather data record
   * @param {Object} data - Weather data to insert
   * @param {number} data.pressure - Pressure value
   * @param {number} data.wind_speed - Wind speed value
   * @param {number} data.temperature - Temperature value
   * @param {number} data.rainfall - Rainfall value
   * @param {string} [data.createdBy] - Optional user ID who created the record
   * @returns {Promise<Object>} The created record
   */
  async create({
    pressure,
    wind_speed,
    temperature,
    rainfall,
    createdBy = null,
  }) {
    const query = {
      text: `
        INSERT INTO records_01959f37704b7c3284133d4637c0337c
          (_id, _created_by, _updated_at, pressure, wind_speed, temperature, rainfall)
        VALUES
          (gen_random_uuid(), $1, NOW(), $2, $3, $4, $5)
        RETURNING *
      `,
      values: [createdBy, pressure, wind_speed, temperature, rainfall],
    };

    const res = await pool.query(query);
    return res.rows[0];
  }
}

module.exports = new WeatherDataRepository();
