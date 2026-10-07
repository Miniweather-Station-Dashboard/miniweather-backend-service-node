// repositories/CollectionsRepositoryFactory.js
const CollectionsRepositoryScyllaDB = require("./collections.scylla.repository");

// Collections (device record schemas) live in Scylla alongside the records.
// Production runs Scylla only, so this resolver is intentionally Scylla-only.
module.exports = CollectionsRepositoryScyllaDB;