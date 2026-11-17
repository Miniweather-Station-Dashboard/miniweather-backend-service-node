const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const deviceId = "91e2e000-cb17-494c-8a45-c6182b2a89ac";
const endTime = "2026-11-13T00:00:00.000Z";
const startTime = "2026-11-12T00:00:00.000Z";
const data = [{ minute: startTime, temperature: 20 }];
function setup(fail = false) {
  const cache = new Map();
  const writes = [];
  const calls = [];
  const redis = { get: async key => cache.get(key), set: async (...args) => {
    writes.push(args); cache.set(args[0], args[1]);
  } };
  const repository = {
    getLatestTimestamp: async () => endTime,
    getMinuteAverages: async opts => { calls.push(opts); if (fail) throw new Error("page failed"); return data; },
  };
  const dependencies = name => {
    if (name.endsWith("helpers/customError")) return require("../src/helpers/customError");
    if (name.endsWith("config/redis")) return redis;
    if (name.endsWith("collections.factory")) return { getSchemaFieldsByDeviceId: async () => ({ temperature: {} }) };
    if (name.endsWith("weatherData.factory")) return repository;
    if (name.endsWith("utils/logger")) return { info() {}, warn() {} };
    return require(name);
  };
  const filename = path.resolve(__dirname, "../src/controllers/v1/weather_data.controller.js");
  const loaded = new Module(filename, module);
  loaded.require = dependencies;
  loaded._compile(readFileSync(filename, "utf8"), filename);
  let cycle;
  const worker = path.resolve(__dirname, "../src/worker/historyPrewarmWorker.js");
  vm.runInNewContext(readFileSync(worker, "utf8"), {
    require: dependencies, process: { env: {} }, setTimeout, clearTimeout,
    setInterval(fn, ms) { assert.equal(ms, 300000); cycle = fn; },
  }, { filename: worker });
  return { cache, writes, calls, cycle, get: (bounds = {}) => loaded.exports.getWeatherDataAverages({ query: {
    deviceId, startTime, endTime, timezone: "Asia/Jakarta", ...bounds,
  } }) };
}
test("old dashboard namespace is ignored and new entries carry exact bounds", async () => {
  const ctx = setup();
  ctx.cache.set(`minute24:${deviceId}`, JSON.stringify([{ shifted: true }]));
  assert.deepEqual((await ctx.get()).data, data);
  assert.equal(ctx.calls.length, 1);
  const [key, value, ...ttl] = ctx.writes[0];
  assert.notEqual(key, `minute24:${deviceId}`);
  assert.deepEqual(JSON.parse(value), { startTime, endTime, data });
  assert.deepEqual(ttl, ["EX", 600]);
});
test("different historical 24h windows cannot reuse device cache", async () => {
  const ctx = setup();
  await ctx.get();
  await ctx.get();
  assert.equal(ctx.calls.length, 1);
  await ctx.get({ startTime: "2026-11-10T00:00:00Z", endTime: "2026-11-11T00:00:00Z" });
  assert.equal(ctx.calls.length, 2);
});
test("prewarm envelope is readable by controller and controller envelope matches", async () => {
  const ctx = setup();
  await ctx.cycle();
  assert.equal(ctx.calls[0].timezone, "Asia/Jakarta");
  assert.equal(ctx.calls[0].tableName, `records_${deviceId.replace(/-/g, "")}`);
  const workerWrite = ctx.writes.at(-1);
  assert.deepEqual(JSON.parse(workerWrite[1]), { startTime, endTime, data });
  assert.deepEqual((await ctx.get()).data, data);
  assert.equal(ctx.calls.length, 1);
  ctx.cache.clear();
  await ctx.get();
  assert.deepEqual(ctx.writes.at(-1), workerWrite);
});
test("repository failure writes no dashboard aggregate in controller or worker", async () => {
  const ctx = setup(true);
  await assert.rejects(ctx.get(), /page failed/);
  await ctx.cycle();
  assert.equal(ctx.writes.filter(([key]) => key.startsWith("minute24:")).length, 0);
});
