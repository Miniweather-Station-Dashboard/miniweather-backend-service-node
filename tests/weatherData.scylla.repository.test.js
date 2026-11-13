const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ResultSet = require("cassandra-driver/lib/types/result-set");

process.env.TZ = "UTC";

const options = {
  tableName: "records_test",
  collectionId: "test-collection",
  startTime: new Date("2026-11-12T00:00:00Z"),
  endTime: new Date("2026-11-13T00:00:00Z"),
  timezone: "UTC",
  fields: ["temperature"],
};

function loadRepository(pages, cached = null) {
  const calls = [];
  const writes = [];
  const client = {
    async execute(query, params, queryOptions) {
      calls.push({ query, params, options: queryOptions });
      const index = queryOptions.pageState
        ? Number(Buffer.from(queryOptions.pageState, "hex").toString())
        : 0;
      assert.ok(index < pages.length, "Unexpected page requested");
      if (pages[index] instanceof Error) throw pages[index];
      const pageState = index + 1 < pages.length
        ? Buffer.from(String(index + 1))
        : null;
      const result = new ResultSet({ rows: pages[index], meta: { pageState } });
      result.nextPageAsync = (state) => client.execute(query, params, {
        ...queryOptions, pageState: state.toString("hex"),
      });
      return result;
    },
  };
  const redis = {
    get: async () => cached,
    set: async (...args) => writes.push(args),
  };
  const filename = path.join(__dirname,
    "../src/repositories/weather_data/weatherData.scylla.repository.js");
  const loaded = new Module(filename, module);
  loaded.require = (name) => {
    if (name === "../../config/scylla") return { client };
    if (name === "../../config/redis") return redis;
    return require(name);
  };
  loaded._compile(readFileSync(filename, "utf8"), filename);
  return { repository: loaded.exports, calls, writes };
}

const row = (timestamp, temperature) => ({
  _updated_at: new Date(timestamp), temperature,
});

test("minute averages cross empty initial and intermediate pages", async () => {
  const pages = [
    ...Array.from({ length: 12 }, () => []),
    [row("2026-11-12T00:01:00Z", 20)],
    [],
    [row("2026-11-12T00:01:30Z", 24), row("2026-11-12T00:00:00Z", 30)],
    [],
  ];
  const { repository, calls, writes } = loadRepository(pages);
  const result = await repository.getMinuteAverages(options);
  assert.deepEqual(result, [
    { minute: new Date("2026-11-12T00:00:00Z"), temperature: 30 },
    { minute: new Date("2026-11-12T00:01:00Z"), temperature: 22 },
  ]);
  assert.equal(calls.length, pages.length);
  for (const call of calls) {
    assert.equal(call.query, calls[0].query);
    assert.deepEqual(call.params, [options.collectionId, options.startTime, options.endTime]);
    assert.equal(call.options.prepare, true);
  }
  assert.equal(writes.length, 1);
  assert.equal(writes[0][1], JSON.stringify(result));
  assert.deepEqual(writes[0].slice(2), ["EX", 300]);
});

test("an exhausted empty result is cached only after all pages are read", async () => {
  const { repository, calls, writes } = loadRepository([[], [], []]);
  assert.deepEqual(await repository.getMinuteAverages(options), []);
  assert.equal(calls.length, 3);
  assert.equal(writes[0][1], "[]");
});

test("a page failure rejects without caching partial averages", async () => {
  const failure = new Error("Scylla page unavailable");
  const { repository, writes } = loadRepository([
    [row("2026-11-12T00:00:00Z", 20)], [], failure,
  ]);
  await assert.rejects(repository.getMinuteAverages(options), failure);
  assert.equal(writes.length, 0);
});

test("a cache hit avoids Scylla queries", async () => {
  const cached = [{ minute: "2026-11-12T00:00:00.000Z", temperature: 20 }];
  const { repository, calls, writes } = loadRepository([], JSON.stringify(cached));
  assert.deepEqual(await repository.getMinuteAverages(options), cached);
  assert.equal(calls.length, 0);
  assert.equal(writes.length, 0);
});

test("raw data crosses empty pages and respects the requested limit", async () => {
  const first = row("2026-11-12T00:00:00Z", 20);
  const second = row("2026-11-12T00:01:00Z", 22);
  const { repository, calls } = loadRepository([
    [], [first], [], [second], new Error("Limit should stop paging"),
  ]);
  assert.deepEqual(await repository.getDataInTimeRange({ ...options, limit: 2 }), [first, second]);
  assert.equal(calls.length, 4);
  assert.equal(calls[0].params.at(-1), 2);
});

test("raw data page failures are not returned as successful partial data", async () => {
  const failure = new Error("Scylla page unavailable");
  const { repository } = loadRepository([
    [row("2026-11-12T00:00:00Z", 20)], [], failure,
  ]);
  await assert.rejects(repository.getDataInTimeRange(options), failure);
});
