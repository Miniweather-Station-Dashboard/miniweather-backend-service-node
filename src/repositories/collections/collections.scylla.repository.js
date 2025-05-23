const { client } = require("../../config/scylla"); 
const crypto = require("crypto");

class CollectionsRepositoryScyllaDB {
  async create({ id, projectId, name, schemaFields }) {
    const query = `
      INSERT INTO collections (id, created_at, updated_at, project_id, name, schema_fields, opt_auth_column_id, opt_ttl)
      VALUES (?, toTimestamp(now()), toTimestamp(now()), ?, ?, ?, false, null)
    `;
    const params = [
      id,
      projectId,
      name,
      JSON.stringify(schemaFields), // Store schemaFields as JSON string
    ];
    await client.execute(query, params, { prepare: true });
  }

  async update(id, { name, schemaFields }) {
    const query = `
      UPDATE collections
      SET name = ?,
          schema_fields = ?,
          updated_at = toTimestamp(now())
      WHERE id = ?
    `;
    const params = [
      name,
      JSON.stringify(schemaFields),
      id,
    ];
    await client.execute(query, params, { prepare: true });
  }

  async removeByNameAndProjectId(name, projectId) {
    // Scylla/Cassandra does not support DELETE with non-PK filter directly.
    // You'll need a table with (project_id, name) as part of the primary key to do this efficiently.
    throw new Error("removeByNameAndProjectId not supported without proper primary key");
  }

  generateId() {
    return crypto.randomUUID();
  }

  async createCollectionTable(deviceId, schemaFields) {
    const tableName = `records_${deviceId.replace(/-/g, "")}`;
    const columns = [
      `"${"_id"}" uuid PRIMARY KEY`,
      `"${"_created_by"}" uuid`,
      `"${"_updated_at"}" timestamp`,
    ];

    for (const [fieldName, fieldDef] of Object.entries(schemaFields)) {
      const safeField = fieldName.replace(/\s+/g, "_").toLowerCase();
      columns.push(`"${safeField}" float`);
    }

    const query = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns.join(",\n")}
      );
    `;

    await client.execute(query);
  }

  async makeCollectionRules(deviceId) {
    const tokenId = process.env.HYPERBASE_TOKEN_ID;
    const projectId = process.env.HYPERBASE_PROJECT_ID;

    if (!tokenId) throw new Error("SYSTEM_TOKEN_ID environment variable is not set");
    if (!projectId) throw new Error("PROJECT_ID environment variable is not set");

    const ruleId = this.generateId();

    const query = `
      INSERT INTO collection_rules (
        id, created_at, updated_at, project_id, token_id, collection_id,
        find_one, find_many, insert_one, update_one, delete_one
      ) VALUES (
        ?, toTimestamp(now()), toTimestamp(now()), ?, ?, ?,
        'all', 'all', true, 'all', 'all'
      )
    `;
    const params = [ruleId, projectId, tokenId, deviceId];
    await client.execute(query, params, { prepare: true });
  }

  async getSchemaFieldsByDeviceId(deviceId) {
    const query = `
      SELECT schema_fields FROM collections WHERE id = ?
    `;
    const result = await client.execute(query, [deviceId], { prepare: true });

    if (result.rowLength === 0) return null;

    const schemaFieldsStr = result.rows[0].schema_fields;

    try {
      return JSON.parse(schemaFieldsStr);
    } catch {
      throw new Error("Failed to parse schema_fields as JSON");
    }
  }
}

module.exports = new CollectionsRepositoryScyllaDB();
