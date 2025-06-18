// repositories/weatherData.scylla.repository.js
const { client } = require("../../config/scylla");
const crypto = require("crypto"); // For generating UUIDs if needed

class WeatherDataRepositoryScyllaDB {
  /**
   * Get minute-by-minute averages of weather data within a time range
   * @param {Object} options - Query options
   * @param {Date} options.startTime - Start of time range
   * @param {Date} options.endTime - End of time range
   * @param {string} options.tableName - Target records table name
   * @param {string} [options.timezone='UTC'] - Timezone (ScyllaDB handles timestamps as UTC by default)
   * @returns {Promise<Array>} Array of minute-averaged records
   */
  async getMinuteAverages({
    startTime,
    endTime,
    tableName,
    timezone = "UTC",
    fields = [],
  }) {
    const sanitizedTable = this._sanitizeTableName(tableName);

    // ScyllaDB does not have a direct equivalent to PostgreSQL's date_trunc with timezone
    // for aggregation like this in a single query.
    // For minute-by-minute averages, you'd typically retrieve data and aggregate in application code
    // or use a pre-aggregated table if performance is critical.
    // This implementation will fetch all data within the range and assume client-side aggregation
    // or that _updated_at is already in the desired 'minute' granularity for simple averages.
    // If exact minute-truncation in a specific timezone is critical, you'd need a different approach
    // (e.g., UDFs, Spark, or more complex client-side logic).

    // For simplicity, we'll fetch data and then manually group and average in memory.
    // This is NOT performant for large datasets.
    const query = `
        SELECT "_updated_at", ${fields.join(", ")}
        FROM ${sanitizedTable}
        WHERE "_updated_at" >= ? AND "_updated_at" <= ?
        ALLOW FILTERING
    `;
    const params = [startTime, endTime];

    const res = await client.execute(query, params, { prepare: true });

    // Client-side aggregation for minute averages
    const minuteAverages = new Map();

    for (const row of res.rows) {
      const date = new Date(row._updated_at);
      // Construct a minute key (e.g., YYYY-MM-DDTHH:MM) in the specified timezone
      // This is a simplified approach, a more robust solution would involve a library like moment-timezone
      const minuteKey = new Date(
        date.toLocaleString("en-US", { timeZone: timezone })
      )
        .toISOString()
        .substring(0, 16); // "YYYY-MM-DDTHH:MM"

      if (!minuteAverages.has(minuteKey)) {
        minuteAverages.set(minuteKey, {
          count: 0,
          values: fields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {}),
        });
      }

      const currentMinuteData = minuteAverages.get(minuteKey);
      currentMinuteData.count++;
      for (const field of fields) {
        if (row[field] != null) {
          currentMinuteData.values[field] += row[field];
        }
      }
    }

    const result = Array.from(minuteAverages.entries())
      .map(([minute, data]) => {
        const averagedValues = {};
        for (const field of fields) {
          averagedValues[field] =
            data.count > 0 ? data.values[field] / data.count : null;
        }
        return { minute: new Date(minute + ":00.000Z"), ...averagedValues }; // Re-add seconds and Z for consistency
      })
      .sort((a, b) => a.minute.getTime() - b.minute.getTime());

    return result;
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

    // In ScyllaDB, filtering on non-primary key columns (like _updated_at if not part of PK)
    // requires ALLOW FILTERING, which is generally discouraged for performance on large datasets.
    // For time-series data, it's common to have a clustering key based on time.
    const query = `
        SELECT *
        FROM ${sanitizedTable}
        WHERE updated_at >= ? AND updated_at <= ?
        LIMIT ?
        ALLOW FILTERING
    `;
    const params = [startTime, endTime, limit];

    const res = await client.execute(query, params, { prepare: true });
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
    const id = crypto.randomUUID(); // ScyllaDB often uses client-generated UUIDs for _id

    // Ensure that _updated_at is a timestamp type in your ScyllaDB schema.
    const query = `
        INSERT INTO ${sanitizedTable}
          (id, _created_by, _updated_at, pressure, wind_speed, temperature, rainfall)
        VALUES
          (?, ?, toTimestamp(now()), ?, ?, ?, ?)
    `;
    const params = [id, createdBy, pressure, wind_speed, temperature, rainfall];

    await client.execute(query, params, { prepare: true });

    // ScyllaDB's INSERT does not have a RETURNING clause like PostgreSQL.
    // If you need the inserted record back, you'd typically construct it
    // from the input parameters and the generated ID.
    return {
      _id: id,
      _created_by: createdBy,
      _updated_at: new Date(), // This will be client-side time, not the exact server timestamp
      pressure,
      wind_speed,
      temperature,
      rainfall,
    };
  }

  /**
   * Sanitize table name to prevent SQL injection
   */
  _sanitizeTableName(tableName) {
    // Basic sanitization for table names. ScyllaDB table names are case-insensitive by default
    // unless quoted, but it's good practice to stick to alphanumeric and underscores.
    // If you always quote them, then case matters. Assuming unquoted for simplicity here.
    if (!/^records_[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error("Invalid table name");
    }
    // ScyllaDB table names don't typically need double quotes unless they contain special characters
    // or you want to force case sensitivity. Assuming standard naming.
    return tableName;
  }

  _buildAvgSelect(fields = []) {
    // This method is primarily for constructing the SELECT clause.
    // In ScyllaDB, direct `AVG()` on a `GROUP BY date_trunc` isn't available.
    // The aggregation will be done client-side.
    // So, this method will just return the field names for selection.
    return fields.join(", ");
  }
}

module.exports = new WeatherDataRepositoryScyllaDB();
