// repositories/CollectionsRepositoryFactory.js
const CollectionsRepositoryPostgreSQL = require("./collections.postgre.repository");
const CollectionsRepositoryScyllaDB = require("./collections.scylla.repository");

function getCollectionsRepository() {
  const dbType = process.env.DB_TYPE || "postgres";

  if (dbType === "scylla") {
    return CollectionsRepositoryScyllaDB;
  } else {
    return CollectionsRepositoryPostgreSQL;
  }
}

module.exports = getCollectionsRepository();
