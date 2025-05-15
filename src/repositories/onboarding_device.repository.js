const {pool} = require("../config/db");

class OnboardingDeviceRepository {
  
  async findAllWithLimit(limit, offset) {
    const query = {
      text: `
        SELECT * FROM onboarding_devices
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      values: [limit, offset],
    };
    const res = await pool.query(query);
    return res.rows; 
  }

  async findById(id) {
    const query = {
      text: "SELECT * FROM onboarding_devices WHERE id = $1",
      values: [id],
    };
    const res = await pool.query(query);
    return res.rows[0]; // returns a single onboarding device object
  }

  async findByName(name) {
    const query = {
      text: "SELECT * FROM onboarding_devices WHERE name = $1",
      values: [name],
    };
    const res = await pool.query(query);
    return res.rows[0]; // returns a single onboarding device object
  }

  // Create a new onboarding device with optional sensor types
  async create({ name, location, userId, status, sensorTypeIds }, client = pool) {
    const query = {
      text: `
        INSERT INTO onboarding_devices (name, location, user_id, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, location, user_id, status
      `,
      values: [name, location, userId, status],
    };
    const res = await client.query(query);
    const device = res.rows[0];

    // Add device sensors if provided
    if (sensorTypeIds && sensorTypeIds.length > 0) {
      for (const sensorTypeId of sensorTypeIds) {
        await this.linkDeviceToSensor(device.id, sensorTypeId);
      }
    }

    return device; // returns the created onboarding device object
  }

  // Update an existing onboarding device
  async update(id, { name, location, status, sensorTypeIds }) {
    const query = {
      text: `
        UPDATE onboarding_devices
        SET name = COALESCE($1, name), location = COALESCE($2, location), status = COALESCE($3, status)
        WHERE id = $4
        RETURNING id, name, location, status
      `,
      values: [name, location, status, id],
    };
    const res = await pool.query(query);
    const updatedDevice = res.rows[0];

    // Update sensors if sensorTypeIds are provided
    if (sensorTypeIds && sensorTypeIds.length > 0) {
      // Remove existing sensor associations
      await this.removeDeviceSensors(id);

      // Add new sensor associations
      for (const sensorTypeId of sensorTypeIds) {
        await this.linkDeviceToSensor(id, sensorTypeId);
      }
    }

    return updatedDevice; // returns the updated onboarding device object
  }

  // Delete an onboarding device by ID
  async delete(id) {
    // Remove device-sensor associations first
    await this.removeDeviceSensors(id);

    const query = {
      text: "DELETE FROM onboarding_devices WHERE id = $1 RETURNING id",
      values: [id],
    };
    const res = await pool.query(query);
    return res.rows[0]; // returns the deleted onboarding device's ID
  }

  // Link a device to a sensor type in the device_sensors table
  async linkDeviceToSensor(deviceId, sensorTypeId) {
    const query = {
      text: `
        INSERT INTO device_sensors (device_id, sensor_type_id)
        VALUES ($1, $2)
        RETURNING id, device_id, sensor_type_id
      `,
      values: [deviceId, sensorTypeId],
    };
    await pool.query(query);
  }

  // Remove all sensor associations for a given device ID
  async removeDeviceSensors(deviceId) {
    const query = {
      text: "DELETE FROM device_sensors WHERE device_id = $1",
      values: [deviceId],
    };
    await pool.query(query);
  }

  // Get all sensors associated with a given device ID
  async getDeviceSensors(deviceId) {
    const query = {
      text: `
        SELECT sensor_types.*
        FROM device_sensors
        JOIN sensor_types ON device_sensors.sensor_type_id = sensor_types.id
        WHERE device_sensors.device_id = $1
      `,
      values: [deviceId],
    };
    const res = await pool.query(query);
    return res.rows; // returns an array of sensor type objects associated with the device
  }
}

module.exports = new OnboardingDeviceRepository();
