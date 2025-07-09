const { pool } = require("../config/postgre");

class RecentActivityRepository {
  async findAllWithLimit(limit, offset) {
    const query = {
      text: `
        SELECT id, message, created_at
        FROM recent_activities
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      values: [limit, offset],
    };
    const res = await pool.query(query);
    return res.rows;
  }

  async countAll() {
    const query = {
      text: `SELECT COUNT(*) FROM recent_activities`,
    };
    const res = await pool.query(query);
    return parseInt(res.rows[0].count, 10);
  }


  async findById(id) {
    const query = {
      text: `SELECT * FROM recent_activities WHERE id = $1`,
      values: [id],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  async create(message, client = pool) {
    const query = {
      text: `
        INSERT INTO recent_activities (message)
        VALUES ($1)
        RETURNING id, message, created_at
      `,
      values: [message],
    };
    const res = await client.query(query);
    return res.rows[0];
  }

  async delete(id) {
    const query = {
      text: `DELETE FROM recent_activities WHERE id = $1 RETURNING id`,
      values: [id],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }
}

module.exports = new RecentActivityRepository();
