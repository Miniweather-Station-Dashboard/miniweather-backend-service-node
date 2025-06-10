const { pool } = require("../../config/postgre");

class WeatherDataRepositoryPostgreSQL {
  /**
   * Get minute-by-minute averages of weather data within a time range
   * @param {Object} options - Query options
   * @param {Date} options.startTime - Start of time range
   * @param {Date} options.endTime - End of time range
   * @param {string} options.tableName - Target records table name
   * @param {string} [options.timezone='UTC'] - Timezone for grouping
   * @returns {Promise<Array>} Array of minute-averaged records
   */
  async getMinuteAverages({ startTime, endTime, tableName, timezone = "UTC", fields= [] }) {
    const sanitizedTable = this._sanitizeTableName(tableName);
    const avgSelect = this._buildAvgSelect(fields);


    const query = {
      text: `
        SELECT
          date_trunc('minute', _updated_at AT TIME ZONE $3) as minute,
          ${avgSelect}
        FROM ${sanitizedTable}
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
   * @param {string} options.tableName - Target records table name
   * @param {number} [options.limit=1000] - Maximum number of records to return
   * @returns {Promise<Array>} Array of raw records
   */
  async getDataInTimeRange({ startTime, endTime, tableName, limit = 1000 }) {
    const sanitizedTable = this._sanitizeTableName(tableName);

    const query = {
      text: `
        SELECT *
        FROM ${sanitizedTable}
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
   * Insert new weather data record into specified table
   * @param {Object} options
   * @param {string} options.tableName - Target table
   * @param {number} options.pressure
   * @param {number} options.wind_speed
   * @param {number} options.temperature
   * @param {number} options.rainfall
   * @param {string} [options.createdBy]
   */
  async create({
    tableName,
    pressure,
    wind_speed,
    temperature,
    rainfall,
    createdBy = null,
  }) {
    const sanitizedTable = this._sanitizeTableName(tableName);

    const query = {
      text: `
        INSERT INTO ${sanitizedTable}
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

  /**
   * Sanitize table name to prevent SQL injection
   */
  _sanitizeTableName(tableName) {
    if (!/^records_[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error("Invalid table name");
    }
    return `"${tableName}"`; 
  }

  _buildAvgSelect(fields = []) {
    return fields
      .map(f => `AVG(${f}) as ${f}`)
      .join(', ');
  }

}

module.exports = new WeatherDataRepositoryPostgreSQL();
