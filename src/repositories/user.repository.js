const { pool } = require("../config/db");

class UserRepository {
  async findByEmail(email) {
    const query = {
      text: "SELECT * FROM users WHERE email = $1",
      values: [email],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  async create({ name, email, passwordHash, is_active }) {
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash,is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, is_active`,
      [name, email, passwordHash, is_active]
    );
    return res.rows[0];
  }

  async activateAccount(email) {
    const res = await pool.query(
      `UPDATE users
       SET is_active = TRUE,
           verification_code = NULL
       WHERE email = $1
       RETURNING id, name, email, role, is_active`,
      [email]
    );
    return res.rows[0];
  }

  async saveRefreshToken({ userId, refreshToken, expiresAt }) {
    const query = {
      text: `
        INSERT INTO refresh_tokens (user_id, refresh_token, expires_at)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, refresh_token, created_at, expires_at, is_revoked
      `,
      values: [userId, refreshToken, expiresAt],
    };

    const res = await pool.query(query);
    return res.rows[0];
  }

  async findByRefreshToken(refreshToken) {
    const query = {
      text: `
        SELECT * FROM refresh_tokens
        WHERE refresh_token = $1
          AND is_revoked = FALSE
          AND expires_at > NOW()
      `,
      values: [refreshToken],
    };

    const res = await pool.query(query);
    return res.rows[0];
  }

  async revokeRefreshToken(tokenId) {
    const query = {
      text: `
        UPDATE refresh_tokens
        SET is_revoked = TRUE
        WHERE id = $1
      `,
      values: [tokenId],
    };

    await pool.query(query);
  }
  async revokeAllRefreshTokens(userId) {
    const query = {
      text: `
        UPDATE refresh_tokens
        SET is_revoked = TRUE
        WHERE user_id = $1`,
      values: [userId],
    };

    await pool.query(query);
  }

  async updateVerificationCode(email, code) {
    const query = {
      text: `
        UPDATE users
        SET verification_code = $1
        WHERE email = $2
      `,
      values: [code, email],
    };
    await pool.query(query);
  }

  async updatePassword(email, passwordHash) {
    const query = {
      text: `
        UPDATE users
        SET password_hash = $1,
            verification_code = NULL
        WHERE email = $2
      `,
      values: [passwordHash, email],
    };
    await pool.query(query);
  }
  
  async findAllPaginated({ page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;
  
  // Get paginated users
  const usersQuery = {
    text: `
      SELECT id, name, email, role, is_active as "isActive", created_at as "createdAt"
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `,
    values: [limit, offset],
  };

  const countQuery = {
    text: 'SELECT COUNT(*) FROM users',
  };

  const [usersResult, countResult] = await Promise.all([
    pool.query(usersQuery),
    pool.query(countQuery)
  ]);

  return {
    records: usersResult.rows,
    total: parseInt(countResult.rows[0].count, 10)
  };
}

  async findById(id) {
    const query = {
      text: `
        SELECT id, name, email, role, is_active, created_at
        FROM users
        WHERE id = $1
      `,
      values: [id],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  async update(id, { name, role }) {
    const query = {
      text: `
        UPDATE users
        SET name = COALESCE($2, name),
            role = COALESCE($3, role),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, email, role, is_active
      `,
      values: [id, name, role],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  async delete(id) {
    const query = {
      text: `
        DELETE FROM users
        WHERE id = $1
        RETURNING id
      `,
      values: [id],
    };
    const res = await pool.query(query);
    return res.rows[0];
  }

  async countAll() {
    const query = {
      text: `SELECT COUNT(*) FROM users`,
    };
    const res = await pool.query(query);
    return parseInt(res.rows[0].count);
  }
}

module.exports = new UserRepository();
