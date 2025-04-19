require('dotenv').config();

const {
  HYPERBASE_PROJECT_ID,
  HYPERBASE_COLLECTION_ID,
  HYPERBASE_AUTH_TOKEN,
  HYPERBASE_HOST
} = process.env;

const HYPERBASE_WS_URL = `ws://${HYPERBASE_HOST}:8081/api/rest/project/${HYPERBASE_PROJECT_ID}/collection/${HYPERBASE_COLLECTION_ID}/subscribe?token=${encodeURIComponent(HYPERBASE_AUTH_TOKEN)}`;

module.exports = {
  HYPERBASE_WS_URL
};
