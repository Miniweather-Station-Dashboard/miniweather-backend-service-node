const { pool } = require("../config/postgre");

class WarningRepository {
    async findAllPaginated({ page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;
        const warningsQuery = {
            text: `
                SELECT
                        id,
                        message,
                        type,
                        is_active as "isActive",
                        source,
                        hazard,
                        level,
                        created_at as "createdAt",
                        updated_at as "updatedAt"
                FROM warnings
                WHERE is_active = true
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
            `,
            values: [limit, offset],
        };
        const countQuery = {
            text: 'SELECT COUNT(*) FROM warnings',
        };
        const [warningsResult, countResult] = await Promise.all([
            pool.query(warningsQuery),
            pool.query(countQuery)
        ]);
        return {
            records: warningsResult.rows,
            total: parseInt(countResult.rows[0].count, 10)
        };
    }

    async findAllPaginatedForAdmin({ page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;
        const warningsQuery = {
            text: `
                SELECT
                        id,
                        message,
                        type,
                        is_active as "isActive",
                        source,
                        hazard,
                        level,
                        created_at as "createdAt",
                        updated_at as "updatedAt"
                FROM warnings
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
            `,
            values: [limit, offset],
        };
        const countQuery = {
            text: 'SELECT COUNT(*) FROM warnings',
        };
        const [warningsResult, countResult] = await Promise.all([
            pool.query(warningsQuery),
            pool.query(countQuery)
        ]);
        return {
            records: warningsResult.rows,
            total: parseInt(countResult.rows[0].count, 10)
        };
    }

    async findById(id) {
        const query = {
            text: `
                SELECT
                        id,
                        message,
                        type,
                        is_active,
                        source,
                        hazard,
                        level,
                        created_at,
                        updated_at
                FROM warnings
                WHERE id = $1
            `,
            values: [id],
        };
        const res = await pool.query(query);
        return res.rows[0];
    }

    async create({ message, type, is_active, source, hazard, level }) {
        const res = await pool.query(
            `INSERT INTO warnings (message, type, is_active, source, hazard, level)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, message, type, is_active as "isActive",
                       source, hazard, level,
                       created_at as "createdAt", updated_at as "updatedAt"`,
            [
                message,
                type === undefined || type === null ? "general" : type,
                is_active === undefined || is_active === null ? true : is_active,
                source === undefined || source === null ? "manual" : source,
                hazard === undefined || hazard === null ? null : hazard,
                level === undefined || level === null ? null : level,
            ]
        );
        return res.rows[0];
    }

    async update(id, { message, type, is_active, source, hazard, level }) {
        const query = {
            text: `
                UPDATE warnings
                SET
                        message = COALESCE($2, message),
                        type = COALESCE($3, type),
                        is_active = COALESCE($4, is_active),
                        source = COALESCE($5, source),
                        hazard = COALESCE($6, hazard),
                        level = COALESCE($7, level),
                        updated_at = NOW()
                WHERE id = $1
                RETURNING id, message, type, is_active as "isActive",
                          source, hazard, level,
                          created_at as "createdAt", updated_at as "updatedAt"
            `,
            values: [id, message, type, is_active, source, hazard, level],
        };
        const res = await pool.query(query);
        return res.rows[0];
    }

    async delete(id) {
        const query = {
            text: `
                DELETE FROM warnings
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
            text: `SELECT COUNT(*) FROM warnings`,
        };
        const res = await pool.query(query);
        return parseInt(res.rows[0].count);
    }
}

module.exports = new WarningRepository();
