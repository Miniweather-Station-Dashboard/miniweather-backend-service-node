const { pool } = require("../config/db");
const crypto = require("crypto");

class CollectionsRepository {
  async create({ id, projectId, name, schemaFields }, client = pool) {
    const query = {
      text: `
        INSERT INTO collections (id, created_at, updated_at, project_id, name, schema_fields, opt_auth_column_id, opt_ttl)
        VALUES ($1, NOW(), NOW(), $2, $3, $4, false, null)
      `,
      values: [id, projectId, name, schemaFields],
    };
    await client.query(query);
  }

  async update(id, { name, schemaFields }, client = pool) {
    const query = {
      text: `
        UPDATE collections
        SET name = $1,
            schema_fields = $2,
            updated_at = NOW()
        WHERE id = $3
      `,
      values: [name, schemaFields, id],
    };
    await client.query(query);
  }

  async removeByNameAndProjectId(name, projectId, client = pool) {
    const query = {
      text: `
        DELETE FROM collections
        WHERE name = $1 AND project_id = $2
      `,
      values: [name, projectId],
    };
    await client.query(query);
  }

  generateId() {
    return crypto.randomUUID();
  }

  async createCollectionTable(deviceId, schemaFields) {
    const tableName = `records_${deviceId.replace(/-/g, "")}`;
    const columnDefs = [
      `"${"_id"}" uuid NOT NULL`,
      `"${"_created_by"}" uuid NULL`,
      `"${"_updated_at"}" timestamptz(6) NULL`,
    ];

    for (const [fieldName, fieldDef] of Object.entries(schemaFields)) {
      const safeField = fieldName.replace(/\s+/g, "_").toLowerCase(); // whitespace to snake_case
      columnDefs.push(`"${safeField}" float4 NULL`);
    }

    const createTableSQL = `
    CREATE TABLE public."${tableName}" (
      ${columnDefs.join(",\n")},
      CONSTRAINT "${tableName}_pkey" PRIMARY KEY ("_id")
    );
  `;

    await pool.query(createTableSQL);
  }
}

module.exports = new CollectionsRepository();
