const pool = require("../config/db");

class SensorTypeRepository {
  async findAllWithLimit(offset, limit = 100) {
    const query = {
      text: `
        SELECT * FROM sensor_types
        ORDER BY name ASC
        LIMIT $1 OFFSET $2
      `,
      values: [limit, offset],
    };
    const res = await pool.query(query);
    return res.rows;
  }

  async findById(id) {
    const query = {
      text: "SELECT * FROM sensor_types WHERE id = $1",
      values: [id],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  async findByName(name) {
    const query = {
      text: "SELECT * FROM sensor_types WHERE name = $1",
      values: [name],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  async create({ name, unit, description }) {
    const query = {
      text: `
        INSERT INTO sensor_types (name, unit, description)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      values: [name, unit, description],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  async update(id, { name, unit, description }) {
    const query = {
      text: `
        UPDATE sensor_types
        SET name = COALESCE($1, name),
            unit = COALESCE($2, unit),
            description = COALESCE($3, description)
        WHERE id = $4
        RETURNING *
      `,
      values: [name, unit, description, id],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  async delete(id) {
    const query = {
      text: "DELETE FROM sensor_types WHERE id = $1 RETURNING id",
      values: [id],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }
}

module.exports = new SensorTypeRepository();
