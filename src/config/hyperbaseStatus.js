const axios = require("axios");

const HYPERBASE_HOST = process.env.HYPERBASE_HOST || "http://localhost:5000";

async function checkHyperbaseStatus() {
  try {
    const res = await axios.get(HYPERBASE_HOST);
    return res.data?.data === "Hyperbase is running";
  } catch (err) {
    return false;
  }
}

module.exports = { checkHyperbaseStatus };
