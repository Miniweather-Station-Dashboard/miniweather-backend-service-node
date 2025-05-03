const pool = require("../config/db");

class DeviceSensorRepository {

    async create({ deviceId, sensorTypeId }, client = pool) {
    const query = {
      text: `
        INSERT INTO device_sensors (device_id, sensor_type_id)
        VALUES ($1, $2)
        RETURNING id, device_id, sensor_type_id, created_at
      `,
      values: [deviceId, sensorTypeId],
    };
    const res = await client.query(query);
    return res.rows[0]; 
  }

  async findByDeviceAndSensor(deviceId, sensorTypeId) {
    const query = {
      text: `
        SELECT * FROM device_sensors 
        WHERE device_id = $1 AND sensor_type_id = $2
      `,
      values: [deviceId, sensorTypeId],
    };
    const res = await pool.query(query);
    return res.rows[0]; 
  }

  async findByDeviceId(deviceId) {
    const query = {
      text: `
        SELECT * FROM device_sensors 
        WHERE device_id = $1
      `,
      values: [deviceId],
    };
    const res = await pool.query(query);
    return res.rows; 
  }

  async delete(deviceId, sensorTypeId) {
    const query = {
      text: `
        DELETE FROM device_sensors
        WHERE device_id = $1 AND sensor_type_id = $2
        RETURNING id
      `,
      values: [deviceId, sensorTypeId],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }
}

module.exports = new DeviceSensorRepository();
