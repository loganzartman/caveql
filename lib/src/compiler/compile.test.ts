import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQuery } from "../parser";
import { compileQuery } from "./compileQuery";

describe("compiler", () => {
  describe("search", () => {
    it("matches bare words", async () => {
      const run = compileQuery(parseQuery("search US").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ country: "US", value: 1 }]);
    });

    it("matches bare numbers", async () => {
      const run = compileQuery(parseQuery("search 1").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ country: "US", value: 1 }]);
    });

    it("is case insensitive for bare words", async () => {
      const run = compileQuery(parseQuery("search us").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ country: "US", value: 1 }]);
    });

    it("coerces numbers to strings", async () => {
      const run = compileQuery(parseQuery("search 1").ast);
      const results = await Array.fromAsync(
        run([
          { country: "CA", value: "2" },
          { country: "US", value: "1" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ country: "US", value: "1" }]);
    });

    it("filters by comparison", async () => {
      const run = compileQuery(parseQuery("search value <= 2").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "CA", value: 2 },
        { country: "US", value: 1 },
      ]);
    });

    it("filters by key/value", async () => {
      const run = compileQuery(parseQuery("search country = 'CA'").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ country: "CA", value: 2 }]);
    });

    it("is case insensitive for key/value", async () => {
      const run = compileQuery(parseQuery("search country = 'ca'").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ country: "CA", value: 2 }]);
    });

    it("is case insensitive for inequality key/value", async () => {
      const run = compileQuery(parseQuery("search country != 'ca'").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "AUS", value: 3 },
        { country: "US", value: 1 },
      ]);
    });

    it("lets boolean OR combine bare words", async () => {
      const run = compileQuery(parseQuery("search US OR CA").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "CA", value: 2 },
        { country: "US", value: 1 },
      ]);
    });

    it("lets boolean AND combine bare words", async () => {
      const run = compileQuery(parseQuery("search US AND WA").ast);
      const results = await Array.fromAsync(
        run([
          { country: "US", state: "HI" },
          { country: "US", state: "WA" },
          { country: "CA", state: "BC" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ country: "US", state: "WA" }]);
    });

    it("lets boolean NOT exclude bare words", async () => {
      const run = compileQuery(parseQuery("search NOT US").ast);
      const results = await Array.fromAsync(
        run([
          { country: "US", state: "HI" },
          { country: "US", state: "WA" },
          { country: "CA", state: "BC" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ country: "CA", state: "BC" }]);
    });
  });

  describe("where", () => {
    it("filters records by expression", async () => {
      const run = compileQuery(parseQuery("where value > 2").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ country: "AUS", value: 3 }]);
    });
  });

  describe("sort", () => {
    it("sorts records with numeric values", async () => {
      const run = compileQuery(parseQuery("| sort value").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 2n },
          { country: "CA", value: 1 },
          { country: "US", value: 3 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "CA", value: 1 },
        { country: "AUS", value: 2n },
        { country: "US", value: 3 },
      ]);
    });

    it("sorts records with string values, descending", async () => {
      const run = compileQuery(parseQuery("| sort -country").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 2 },
          { country: "CA", value: 1 },
          { country: "US", value: 3 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "US", value: 3 },
        { country: "CA", value: 1 },
        { country: "AUS", value: 2 },
      ]);
    });

    it("sorts records by two fields", async () => {
      const run = compileQuery(parseQuery("| sort country, value").ast);
      const results = await Array.fromAsync(
        run([
          { country: "US", value: 2 },
          { country: "US", value: 1 },
          { country: "AUS", value: 3 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "AUS", value: 3 },
        { country: "US", value: 1 },
        { country: "US", value: 2 },
      ]);
    });

    it("sorts records by heterogeneous fields", async () => {
      const run = compileQuery(parseQuery("| sort value").ast);
      const results = await Array.fromAsync(
        run([
          { country: "A", value: "hello" },
          { country: "B", value: 1 },
          { country: "C", value: "$" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "C", value: "$" },
        { country: "B", value: 1 },
        { country: "A", value: "hello" },
      ]);
    });

    it("sorts records by explicit comparator", async () => {
      const run = compileQuery(parseQuery("| sort -str(value)").ast);
      const results = await Array.fromAsync(
        run([
          { country: "C", value: 10000 },
          { country: "A", value: 300 },
          { country: "B", value: 2000 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "A", value: 300 },
        { country: "B", value: 2000 },
        { country: "C", value: 10000 },
      ]);
    });

    it("returns first N records from sorted order for count N", async () => {
      const run = compileQuery(parseQuery("| sort 3 value").ast);
      const results = await Array.fromAsync(
        run([
          { country: "A", value: 6 },
          { country: "B", value: 3 },
          { country: "C", value: 1 },
          { country: "D", value: 5 },
          { country: "E", value: 4 },
          { country: "F", value: 2 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "C", value: 1 },
        { country: "F", value: 2 },
        { country: "B", value: 3 },
      ]);
    });
  });

  describe("fields", () => {
    it("reorders fields in records", async () => {
      const run = compileQuery(parseQuery("| fields population, country").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", population: 1000 },
          { country: "CA", population: 500 },
          { country: "US", population: 300 },
        ]),
      );

      assert.partialDeepStrictEqual(
        Object.values(results).map((v) => Object.keys(v)),
        [
          ["population", "country"],
          ["population", "country"],
          ["population", "country"],
        ],
      );
    });

    it("removes specified fields from records", async () => {
      const run = compileQuery(parseQuery("| fields -country, population").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3, population: 1000, food: "pavlova" },
          { country: "CA", value: 2, population: 500, food: "poutine" },
          { country: "US", value: 1, population: 300, food: "pizza" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { value: 3, food: "pavlova" },
        { value: 2, food: "poutine" },
        { value: 1, food: "pizza" },
      ]);
    });

    it("retains specified fields in records", async () => {
      const run = compileQuery(parseQuery("| fields country, food").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3, population: 1000, food: "pavlova" },
          { country: "CA", value: 2, population: 500, food: "poutine" },
          { country: "US", value: 1, population: 300, food: "pizza" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "AUS", food: "pavlova" },
        { country: "CA", food: "poutine" },
        { country: "US", food: "pizza" },
      ]);
    });

    it("removes specified deep fields from records", async () => {
      const run = compileQuery(parseQuery("| fields -population.count").ast);
      const results = await Array.fromAsync(
        run([
          { country: "AUS", value: 3, population: { count: 1000 } },
          { country: "CA", value: 2, population: { count: 500 } },
          { country: "US", value: 1, population: { count: 300 } },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "AUS", value: 3, population: {} },
        { country: "CA", value: 2, population: {} },
        { country: "US", value: 1, population: {} },
      ]);
    });

    it("retains specified deep fields in records", async () => {
      const run = compileQuery(
        parseQuery("| fields country, population.count").ast,
      );
      const results = await Array.fromAsync(
        run([
          {
            country: "AUS",
            value: 3,
            population: { count: 1000, type: "int" },
          },
          { country: "CA", value: 2, population: { count: 500, type: "int" } },
          { country: "US", value: 1, population: { count: 300, type: "int" } },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "AUS", population: { count: 1000 } },
        { country: "CA", population: { count: 500 } },
        { country: "US", population: { count: 300 } },
      ]);
    });
  });

  describe("stats", () => {
    it("aggregates with count function", async () => {
      const run = compileQuery(parseQuery("stats count(events)").ast);
      const results = await Array.fromAsync(
        run([
          { events: 1, country: "US" },
          { events: 2, country: "CA" },
          { events: 3, country: "US" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ "count(events)": 3 }]);
    });

    it("aggregates with field renaming using 'as' keyword", async () => {
      const run = compileQuery(
        parseQuery("stats count(events) as total_events").ast,
      );
      const results = await Array.fromAsync(
        run([
          { events: 1, country: "US" },
          { events: 2, country: "CA" },
          { events: 3, country: "US" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ total_events: 3 }]);
    });

    it("aggregates with multiple functions and field renaming", async () => {
      const run = compileQuery(
        parseQuery("stats count(events) as total, avg(price) as avg_price").ast,
      );
      const results = await Array.fromAsync(
        run([
          { events: 1, price: 10, country: "US" },
          { events: 2, price: 20, country: "CA" },
          { events: 3, price: 30, country: "US" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ total: 3, avg_price: 20 }]);
    });

    it("handles field names with parentheses in aggregation functions", async () => {
      const run = compileQuery(
        parseQuery("stats count(field(with)parens) as renamed").ast,
      );
      const results = await Array.fromAsync(
        run([
          { "field(with)parens": 1 },
          { "field(with)parens": 2 },
          { "field(with)parens": 3 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ renamed: 3 }]);
    });

    it("groups by a single field", async () => {
      const run = compileQuery(
        parseQuery("stats count(events) as total by country").ast,
      );
      const results = await Array.fromAsync(
        run([
          { events: 1, country: "US" },
          { events: 2, country: "CA" },
          { events: 3, country: "US" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "US", total: 2 },
        { country: "CA", total: 1 },
      ]);
    });

    it("groups by multiple fields", async () => {
      const run = compileQuery(
        parseQuery("stats count(events) as total by country, state").ast,
      );
      const results = await Array.fromAsync(
        run([
          { events: 1, country: "US", state: "CA" },
          { events: 2, country: "US", state: "WA" },
          { events: 3, country: "US", state: "CA" },
          { events: 4, country: "CA", state: "BC" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "US", state: "CA", total: 2 },
        { country: "US", state: "WA", total: 1 },
        { country: "CA", state: "BC", total: 1 },
      ]);
    });

    it("groups with multiple aggregations", async () => {
      const run = compileQuery(
        parseQuery(
          "stats count(events) as total, avg(price) as avg_price by country",
        ).ast,
      );
      const results = await Array.fromAsync(
        run([
          { events: 1, price: 10, country: "US" },
          { events: 2, price: 20, country: "CA" },
          { events: 3, price: 30, country: "US" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "US", total: 2, avg_price: 20 },
        { country: "CA", total: 1, avg_price: 20 },
      ]);
    });

    it("calculates median", async () => {
      const run = compileQuery(parseQuery("stats median(value)").ast);
      const results = await Array.fromAsync(
        run([
          { value: 1 },
          { value: 2 },
          { value: 3 },
          { value: 4 },
          { value: 5 },
        ]),
      );

      // median of [1,2,3,4,5] is the middle value: 3
      assert.partialDeepStrictEqual(results, [{ "median(value)": 3 }]);
    });

    it("calculates median with even number of values", async () => {
      const run = compileQuery(parseQuery("stats median(value) as med").ast);
      const results = await Array.fromAsync(
        run([{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]),
      );

      // Median implementation uses upper middle value for even counts
      assert.partialDeepStrictEqual(results, [{ med: 3 }]);
    });

    it("calculates mode", async () => {
      const run = compileQuery(
        parseQuery("stats mode(value) as most_common").ast,
      );
      const results = await Array.fromAsync(
        run([
          { value: 2 },
          { value: 3 },
          { value: 1 },
          { value: 2 },
          { value: 3 },
          { value: 2 },
          { value: 3 },
        ]),
      );

      // Returns first mode encountered (2 appears 3 times)
      assert.partialDeepStrictEqual(results, [{ most_common: 2 }]);
    });

    it("calculates mode with strings", async () => {
      const run = compileQuery(parseQuery("stats mode(category)").ast);
      const results = await Array.fromAsync(
        run([
          { category: "A" },
          { category: "B" },
          { category: "A" },
          { category: "C" },
          { category: "A" },
        ]),
      );

      // Returns first mode encountered (A appears 3 times)
      assert.partialDeepStrictEqual(results, [{ "mode(category)": "A" }]);
    });

    it("calculates range", async () => {
      const run = compileQuery(
        parseQuery("stats range(value) as val_range").ast,
      );
      const results = await Array.fromAsync(
        run([{ value: 10 }, { value: 50 }, { value: 30 }, { value: 20 }]),
      );

      assert.partialDeepStrictEqual(results, [{ val_range: 40 }]);
    });

    it("calculates variance", async () => {
      const run = compileQuery(parseQuery("stats var(value) as variance").ast);
      const results = await Array.fromAsync(
        run([{ value: 1 }, { value: 3 }, { value: 5 }]),
      );

      // Sample variance of [1, 3, 5] = 4
      assert.partialDeepStrictEqual(results, [{ variance: 4 }]);
    });

    it("calculates standard deviation", async () => {
      const run = compileQuery(parseQuery("stats stdev(value) as std").ast);
      const results = await Array.fromAsync(
        run([{ value: 1 }, { value: 3 }, { value: 5 }]),
      );

      // Sample stdev of [1, 3, 5] = 2
      assert.partialDeepStrictEqual(results, [{ std: 2 }]);
    });

    it("calculates percentile", async () => {
      const run = compileQuery(parseQuery("stats perc50(value) as p50").ast);
      const results = await Array.fromAsync(
        run([
          { value: 1 },
          { value: 2 },
          { value: 3 },
          { value: 4 },
          { value: 5 },
        ]),
      );

      // 50th percentile of [1,2,3,4,5] is 3
      assert.partialDeepStrictEqual(results, [{ p50: 3 }]);
    });

    it("calculates approximate percentile for large dataset", async () => {
      const run = compileQuery(parseQuery("stats perc90(value) as p90").ast);
      const results = await Array.fromAsync(
        run(Array.from({ length: 10000 }, (_, i) => ({ value: i }))),
      );

      // expect roughly 9000
      const p90 = results[0].p90;
      if (typeof p90 !== "number") {
        throw new Error("p90 is not a number");
      }
      assert.ok(
        p90 >= 8950 && p90 <= 9050,
        `p90 is ${p90}, expected between 8950 and 9050`,
      );
    });

    it("calculates exact percentile", async () => {
      const run = compileQuery(
        parseQuery("stats exactperc95(value) as p95").ast,
      );
      const results = await Array.fromAsync(
        run([
          { value: 1 },
          { value: 2 },
          { value: 3 },
          { value: 4 },
          { value: 5 },
          { value: 6 },
          { value: 7 },
          { value: 8 },
          { value: 9 },
          { value: 10 },
        ]),
      );

      // 95th percentile of [1..10]
      assert.partialDeepStrictEqual(results, [{ p95: 10 }]);
    });

    it("calcules exact percentile for large dataset", async () => {
      const run = compileQuery(
        parseQuery("stats exactperc90(value) as p90").ast,
      );
      const results = await Array.fromAsync(
        run(Array.from({ length: 10000 }, (_, i) => ({ value: i }))),
      );

      // expect roughly 9000
      const p90 = results[0].p90;
      if (typeof p90 !== "number") {
        throw new Error("p90 is not a number");
      }
      assert.strictEqual(p90, 9000);
    });

    it("calculates median, mode, range, and stdev", async () => {
      const run = compileQuery(
        parseQuery(
          "stats median(value) as med, mode(value) as mod, range(value) as rng, stdev(value) as sd",
        ).ast,
      );
      const results = await Array.fromAsync(
        run([
          { value: 1 },
          { value: 2 },
          { value: 2 },
          { value: 3 },
          { value: 5 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        {
          med: 2, // median of [1,2,2,3,5] is the middle value: 2
          mod: 2,
          rng: 4,
          sd: 1.51657508881031, // sample stdev
        },
      ]);
    });
  });

  describe("streamstats", () => {
    it("provides running aggregation with field renaming", async () => {
      const run = compileQuery(
        parseQuery("streamstats count(events) as running_total").ast,
      );
      const results = await Array.fromAsync(
        run([
          { events: 1, country: "US" },
          { events: 2, country: "CA" },
          { events: 3, country: "US" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { events: 1, country: "US", running_total: 1 },
        { events: 2, country: "CA", running_total: 2 },
        { events: 3, country: "US", running_total: 3 },
      ]);
    });

    it("provides running aggregation with multiple functions and field renaming", async () => {
      const run = compileQuery(
        parseQuery(
          "streamstats count(events) as total, avg(price) as avg_price",
        ).ast,
      );
      const results = await Array.fromAsync(
        run([
          { events: 1, price: 10, country: "US" },
          { events: 2, price: 20, country: "CA" },
          { events: 3, price: 30, country: "US" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { events: 1, price: 10, country: "US", total: 1, avg_price: 10 },
        { events: 2, price: 20, country: "CA", total: 2, avg_price: 15 },
        { events: 3, price: 30, country: "US", total: 3, avg_price: 20 },
      ]);
    });

    it("handles field names with parentheses in running aggregation", async () => {
      const run = compileQuery(
        parseQuery("streamstats count(field(with)parens) as running_count").ast,
      );
      const results = await Array.fromAsync(
        run([
          { "field(with)parens": 1, id: "a" },
          { "field(with)parens": 2, id: "b" },
          { "field(with)parens": 3, id: "c" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { "field(with)parens": 1, id: "a", running_count: 1 },
        { "field(with)parens": 2, id: "b", running_count: 2 },
        { "field(with)parens": 3, id: "c", running_count: 3 },
      ]);
    });

    it("groups by a single field with running aggregation", async () => {
      const run = compileQuery(
        parseQuery("streamstats count(events) as total by country").ast,
      );
      const results = await Array.fromAsync(
        run([
          { events: 1, country: "US" },
          { events: 2, country: "CA" },
          { events: 3, country: "US" },
          { events: 4, country: "CA" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { events: 1, country: "US", total: 1 },
        { events: 2, country: "CA", total: 1 },
        { events: 3, country: "US", total: 2 },
        { events: 4, country: "CA", total: 2 },
      ]);
    });

    it("groups by multiple fields with running aggregation", async () => {
      const run = compileQuery(
        parseQuery("streamstats count(events) as total by country, state").ast,
      );
      const results = await Array.fromAsync(
        run([
          { events: 1, country: "US", state: "CA" },
          { events: 2, country: "US", state: "WA" },
          { events: 3, country: "US", state: "CA" },
          { events: 4, country: "CA", state: "BC" },
          { events: 5, country: "US", state: "CA" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { events: 1, country: "US", state: "CA", total: 1 },
        { events: 2, country: "US", state: "WA", total: 1 },
        { events: 3, country: "US", state: "CA", total: 2 },
        { events: 4, country: "CA", state: "BC", total: 1 },
        { events: 5, country: "US", state: "CA", total: 3 },
      ]);
    });

    it("groups with multiple running aggregations", async () => {
      const run = compileQuery(
        parseQuery(
          "streamstats count(events) as total, avg(price) as avg_price by country",
        ).ast,
      );
      const results = await Array.fromAsync(
        run([
          { events: 1, price: 10, country: "US" },
          { events: 2, price: 20, country: "CA" },
          { events: 3, price: 30, country: "US" },
          { events: 4, price: 40, country: "CA" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { events: 1, price: 10, country: "US", total: 1, avg_price: 10 },
        { events: 2, price: 20, country: "CA", total: 1, avg_price: 20 },
        { events: 3, price: 30, country: "US", total: 2, avg_price: 20 },
        { events: 4, price: 40, country: "CA", total: 2, avg_price: 30 },
      ]);
    });

    it("calculates running median", async () => {
      const run = compileQuery(
        parseQuery("streamstats median(value) as running_median").ast,
      );
      const results = await Array.fromAsync(
        run([{ value: 1 }, { value: 5 }, { value: 3 }, { value: 2 }]),
      );

      assert.partialDeepStrictEqual(results, [
        { value: 1, running_median: 1 },
        { value: 5, running_median: 5 },
        { value: 3, running_median: 3 },
        { value: 2, running_median: 3 },
      ]);
    });

    it("calculates running mode", async () => {
      const run = compileQuery(
        parseQuery("streamstats mode(value) as running_mode").ast,
      );
      const results = await Array.fromAsync(
        run([
          { value: 2 },
          { value: 1 },
          { value: 2 },
          { value: 3 },
          { value: 3 },
          { value: 3 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { value: 2, running_mode: 2 },
        { value: 1, running_mode: 2 },
        { value: 2, running_mode: 2 },
        { value: 3, running_mode: 2 },
        { value: 3, running_mode: 2 },
        { value: 3, running_mode: 3 },
      ]);
    });

    it("calculates running range", async () => {
      const run = compileQuery(
        parseQuery("streamstats range(value) as running_range").ast,
      );
      const results = await Array.fromAsync(
        run([{ value: 5 }, { value: 2 }, { value: 8 }, { value: 1 }]),
      );

      assert.partialDeepStrictEqual(results, [
        { value: 5, running_range: 0 },
        { value: 2, running_range: 3 },
        { value: 8, running_range: 6 },
        { value: 1, running_range: 7 },
      ]);
    });

    it("calculates running variance", async () => {
      const run = compileQuery(
        parseQuery("streamstats var(value) as running_var").ast,
      );
      const results = await Array.fromAsync(
        run([{ value: 1 }, { value: 3 }, { value: 5 }]),
      );

      assert.partialDeepStrictEqual(results, [
        { value: 1, running_var: 0 },
        { value: 3, running_var: 2 },
        { value: 5, running_var: 4 },
      ]);
    });

    it("calculates running standard deviation", async () => {
      const run = compileQuery(
        parseQuery("streamstats stdev(value) as running_stdev").ast,
      );
      const results = await Array.fromAsync(
        run([{ value: 1 }, { value: 3 }, { value: 5 }]),
      );

      assert.partialDeepStrictEqual(results, [
        { value: 1, running_stdev: 0 },
        { value: 3, running_stdev: Math.SQRT2 },
        { value: 5, running_stdev: 2 },
      ]);
    });

    it("calculates running percentiles", async () => {
      const run = compileQuery(
        parseQuery(
          "streamstats perc50(value) as p50, exactperc75(value) as p75",
        ).ast,
      );
      const results = await Array.fromAsync(
        run([{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]),
      );

      assert.partialDeepStrictEqual(results, [
        { value: 1, p50: 1, p75: 1 },
        { value: 2, p50: 2, p75: 2 }, // rounds up for even counts
        { value: 3, p50: 2, p75: 3 }, // median of [1,2,3] is 2
        { value: 4, p50: 3, p75: 4 }, // rounds up for even counts
      ]);
    });

    it("calculates running aggregations with grouping", async () => {
      const run = compileQuery(
        parseQuery("streamstats median(value) as med by country").ast,
      );
      const results = await Array.fromAsync(
        run([
          { value: 1, country: "US" },
          { value: 2, country: "CA" },
          { value: 5, country: "US" },
          { value: 4, country: "CA" },
          { value: 3, country: "US" },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { value: 1, country: "US", med: 1 },
        { value: 2, country: "CA", med: 2 },
        { value: 5, country: "US", med: 5 }, // median of [1, 5] rounds up to 5
        { value: 4, country: "CA", med: 4 }, // median of [2, 4] rounds up to 4
        { value: 3, country: "US", med: 3 }, // median of [1, 3, 5] is 3
      ]);
    });

    it("calculates multiple running new aggregations", async () => {
      const run = compileQuery(
        parseQuery(
          "streamstats median(value) as med, stdev(value) as sd, range(value) as rng",
        ).ast,
      );
      const results = await Array.fromAsync(
        run([{ value: 1 }, { value: 3 }, { value: 5 }]),
      );

      assert.partialDeepStrictEqual(results, [
        { value: 1, med: 1, sd: 0, rng: 0 },
        { value: 3, med: 3, sd: Math.SQRT2, rng: 2 }, // median of [1, 3] rounds up to 3
        { value: 5, med: 3, sd: 2, rng: 4 }, // median of [1, 3, 5] is 3
      ]);
    });
  });

  describe("eval", () => {
    it("can set a field to a literal string", async () => {
      const run = compileQuery(parseQuery("| eval newField='hey'").ast);
      const results = await Array.fromAsync(run([{ id: 1 }, { id: 2 }]));

      assert.partialDeepStrictEqual(results, [
        { id: 1, newField: "hey" },
        { id: 2, newField: "hey" },
      ]);
    });

    it("can deeply set a new field to a literal string", async () => {
      const run = compileQuery(parseQuery("| eval newField.nested='hey'").ast);
      const results = await Array.fromAsync(run([{ id: 1 }, { id: 2 }]));

      assert.partialDeepStrictEqual(results, [
        { id: 1, newField: { nested: "hey" } },
        { id: 2, newField: { nested: "hey" } },
      ]);
    });

    it("can deeply set an existing field to a literal string", async () => {
      const run = compileQuery(parseQuery("| eval newField.nested='hey'").ast);
      const results = await Array.fromAsync(
        run([
          { id: 1, newField: { nested: "old", test: "value" } },
          { id: 2, newField: { nested: "old", test: "value" } },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { id: 1, newField: { nested: "hey", test: "value" } },
        { id: 2, newField: { nested: "hey", test: "value" } },
      ]);
    });

    it("can be used to rename a field", async () => {
      const run = compileQuery(parseQuery("| eval newField=oldField").ast);
      const results = await Array.fromAsync(run([{ oldField: "value" }]));

      assert.partialDeepStrictEqual(results, [
        { newField: "value", oldField: "value" },
      ]);
    });

    it("can use case() to select values", async () => {
      const run = compileQuery(
        parseQuery("| eval out=case(a=1, 'one', a=2, 'two')").ast,
      );
      const results = await Array.fromAsync(
        run([{ a: 1n }, { a: 2n }, { a: 3n }]),
      );
      assert.partialDeepStrictEqual(results, [
        { a: 1n, out: "one" },
        { a: 2n, out: "two" },
        { a: 3n },
      ]);
    });

    it("can use coalesce() to pick first non-null", async () => {
      const run = compileQuery(parseQuery("| eval out=coalesce(a,b,3)").ast);
      const results = await Array.fromAsync(
        run([
          { a: null, b: 2 },
          { a: 1, b: null },
          { a: null, b: null },
        ]),
      );
      assert.partialDeepStrictEqual(results, [
        { a: null, b: 2, out: 2 },
        { a: 1, b: null, out: 1 },
        { a: null, b: null, out: 3n },
      ]);
    });

    it("can use false() and true()", async () => {
      const run = compileQuery(
        parseQuery("| eval f=false() | eval t=true()").ast,
      );
      const results = await Array.fromAsync(run([{}, {}, {}]));
      assert(results.every((r) => r.f === false && r.t === true));
    });

    it("can use if() for conditional logic", async () => {
      const run = compileQuery(
        parseQuery("| eval out=if(a>1,'big','small')").ast,
      );
      const results = await Array.fromAsync(run([{ a: 2 }, { a: 1 }]));
      assert.partialDeepStrictEqual(results, [
        { a: 2, out: "big" },
        { a: 1, out: "small" },
      ]);
    });

    it("can use isnull() to check null/undefined", async () => {
      const run = compileQuery(parseQuery("| eval out=isnull(a)").ast);
      const results = await Array.fromAsync(
        run([{ a: null }, { a: undefined }, { a: 1 }]),
      );
      assert.deepEqual(
        results.map((r) => r.out),
        [true, true, false],
      );
    });

    it("can use isnum() to check for numbers", async () => {
      const run = compileQuery(parseQuery("| eval out=isnum(a)").ast);
      const results = await Array.fromAsync(
        run([{ a: 1 }, { a: 1n }, { a: "x" }, { a: NaN }]),
      );
      assert.deepEqual(
        results.map((r) => r.out),
        [true, true, false, false],
      );
    });

    it("can use len() to get string length", async () => {
      const run = compileQuery(parseQuery("| eval out=len(a)").ast);
      const results = await Array.fromAsync(run([{ a: "hi" }, { a: 1234 }]));
      assert.deepEqual(
        results.map((r) => r.out),
        [2, 4],
      );
    });

    it("can use match() for regex", async () => {
      const run = compileQuery(parseQuery("| eval out=match(a,'^h.*o$')").ast);
      const results = await Array.fromAsync(
        run([{ a: "hello" }, { a: "world" }]),
      );
      assert.deepEqual(
        results.map((r) => r.out),
        [true, false],
      );
    });

    it("can use null() to set null", async () => {
      const run = compileQuery(parseQuery("| eval out=null()").ast);
      const results = await Array.fromAsync(run([{}]));
      assert.strictEqual(results[0].out, null);
    });

    it("can use random() to generate a value", async () => {
      const run = compileQuery(parseQuery("| eval out=random()").ast);
      const results = await Array.fromAsync(run([{}, {}, {}]));
      assert(results.every((r) => typeof r.out === "number"));
    });

    it("can use replace() to substitute text", async () => {
      const run = compileQuery(
        parseQuery("| eval out=replace(a,'l+','x')").ast,
      );
      const results = await Array.fromAsync(
        run([{ a: "hello" }, { a: "ball" }]),
      );
      assert.deepEqual(
        results.map((r) => r.out),
        ["hexo", "bax"],
      );
    });

    it("can use round() to round numbers", async () => {
      const run = compileQuery(parseQuery("| eval out=round(a)").ast);
      const results = await Array.fromAsync(run([{ a: 1.2 }, { a: 2.7 }]));
      assert.deepEqual(
        results.map((r) => r.out),
        [1, 3],
      );
    });

    for (const op of ["+", "-", "*", "/", "%"]) {
      it(`operates on bigints with ${op}`, async () => {
        const run = compileQuery(parseQuery(`| eval out = a ${op} b`).ast);
        const record = { a: 1n, b: 2n };
        const results = await Array.fromAsync(run([record]));
        // biome-ignore lint/security/noGlobalEval: testing
        assert.deepEqual(results[0].out, eval(`record.a ${op} record.b`));
      });

      it(`operates on float numbers with ${op}`, async () => {
        const run = compileQuery(parseQuery(`| eval out = a ${op} b`).ast);
        const record = { a: 1.2, b: 2.3 };
        const results = await Array.fromAsync(run([record]));
        // biome-ignore lint/security/noGlobalEval: testing
        assert.deepEqual(results[0].out, eval(`record.a ${op} record.b`));
      });

      it(`coerces bigint to number with ${op}`, async () => {
        const run = compileQuery(parseQuery(`| eval out = a ${op} b`).ast);
        const record = { a: 1, b: 2n };
        const results = await Array.fromAsync(run([record]));
        assert.deepEqual(
          results[0].out,
          // biome-ignore lint/security/noGlobalEval: testing
          eval(`record.a ${op} Number(record.b)`),
        );
      });
    }

    it("concatenates strings with +", async () => {
      const run = compileQuery(parseQuery("| eval out = a + b").ast);
      const results = await Array.fromAsync(run([{ a: "hello", b: "world" }]));
      assert.deepEqual(results[0].out, "helloworld");
    });

    it("concatenates strings with .", async () => {
      const run = compileQuery(parseQuery("| eval out = a . b").ast);
      const results = await Array.fromAsync(run([{ a: "hello", b: "world" }]));
      assert.deepEqual(results[0].out, "helloworld");
    });

    it("coerces numbers to strings with .", async () => {
      const run = compileQuery(parseQuery("| eval out = a . b").ast);
      const results = await Array.fromAsync(run([{ a: 1, b: 2 }]));
      assert.deepEqual(results[0].out, "12");
    });
  });

  describe("rex", () => {
    it("can extract a field with regex", async () => {
      const run = compileQuery(
        parseQuery("| rex field=name '(?<name2>j(?:ay|ules))'").ast,
      );
      const results = await Array.fromAsync(
        run([{ name: "jay" }, { name: "jerry" }, { name: "jules" }]),
      );

      assert.partialDeepStrictEqual(results, [
        { name: "jay", name2: "jay" },
        { name: "jerry" },
        { name: "jules", name2: "jules" },
      ]);
    });

    it("can replace a needle with mode=sed", async () => {
      const run = compileQuery(
        parseQuery("| rex field=name mode=sed 's/ay/ames/'").ast,
      );
      const results = await Array.fromAsync(
        run([{ name: "jay" }, { name: "jerry" }, { name: "jules" }]),
      );

      assert.partialDeepStrictEqual(results, [
        { name: "james" },
        { name: "jerry" },
        { name: "jules" },
      ]);
    });

    it("supports weird delimiters and escapes with mode=sed", async () => {
      const run = compileQuery(
        parseQuery("| rex field=name mode=sed 's|ay\\|erry|ames|'").ast,
      );
      const results = await Array.fromAsync(
        run([{ name: "jay" }, { name: "jerry" }, { name: "jules" }]),
      );

      assert.partialDeepStrictEqual(results, [
        { name: "james" },
        { name: "james" },
        { name: "jules" },
      ]);
    });

    it("defaults to field=_raw", async () => {
      const run = compileQuery(parseQuery("| rex '(?<name>j(?:ay|ules))'").ast);
      const results = await Array.fromAsync(
        run([{ _raw: "jay" }, { _raw: "jerry" }, { _raw: "jules" }]),
      );

      assert.partialDeepStrictEqual(results, [
        { _raw: "jay", name: "jay" },
        { _raw: "jerry" },
        { _raw: "jules", name: "jules" },
      ]);
    });
  });

  describe("head", () => {
    it("defaults to 10 records when no arguments provided", async () => {
      const run = compileQuery(parseQuery("| head").ast);
      const results = await Array.fromAsync(
        run([
          { id: 1 },
          { id: 2 },
          { id: 3 },
          { id: 4 },
          { id: 5 },
          { id: 6 },
          { id: 7 },
          { id: 8 },
          { id: 9 },
          { id: 10 },
          { id: 11 },
          { id: 12 },
        ]),
      );

      assert.equal(results.length, 10);
      assert.partialDeepStrictEqual(results[0], { id: 1 });
      assert.partialDeepStrictEqual(results[9], { id: 10 });
    });

    it("returns first N records with numeric limit", async () => {
      const run = compileQuery(parseQuery("| head 3").ast);
      const results = await Array.fromAsync(
        run([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]),
      );

      assert.partialDeepStrictEqual(results, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it("returns first N records with limit parameter", async () => {
      const run = compileQuery(parseQuery("| head limit=2").ast);
      const results = await Array.fromAsync(
        run([{ id: 1 }, { id: 2 }, { id: 3 }]),
      );

      assert.partialDeepStrictEqual(results, [{ id: 1 }, { id: 2 }]);
    });

    it("throws error when both limit and n are specified", () => {
      assert.throws(
        () => compileQuery(parseQuery("| head limit=5 10").ast),
        /limit and n cannot be specified together/,
      );
    });

    it("returns all records if limit is greater than count", async () => {
      const run = compileQuery(parseQuery("| head 10").ast);
      const results = await Array.fromAsync(run([{ id: 1 }, { id: 2 }]));

      assert.partialDeepStrictEqual(results, [{ id: 1 }, { id: 2 }]);
    });

    it("handles empty input", async () => {
      const run = compileQuery(parseQuery("| head 5").ast);
      const results = await Array.fromAsync(run([]));

      assert.partialDeepStrictEqual(results, []);
    });

    it("works in a pipeline", async () => {
      const run = compileQuery(parseQuery("search country='US' | head 2").ast);
      const results = await Array.fromAsync(
        run([
          { country: "US", value: 1 },
          { country: "CA", value: 2 },
          { country: "US", value: 3 },
          { country: "US", value: 4 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { country: "US", value: 1 },
        { country: "US", value: 3 },
      ]);
    });

    it("stops at first record when expression is falsy", async () => {
      const run = compileQuery(parseQuery("| head (value)").ast);
      const results = await Array.fromAsync(
        run([
          { id: 1, value: 0 },
          { id: 2, value: 30 },
          { id: 3, value: 60 },
        ]),
      );

      assert.partialDeepStrictEqual(results, []);
    });

    it("includes first falsy record with keeplast=true", async () => {
      const run = compileQuery(parseQuery("| head keeplast=true (value)").ast);
      const results = await Array.fromAsync(
        run([
          { id: 1, value: 0 },
          { id: 2, value: 30 },
          { id: 3, value: 60 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ id: 1, value: 0 }]);
    });

    it("yields all truthy records before stopping at first falsy", async () => {
      const run = compileQuery(parseQuery("| head (value)").ast);
      const results = await Array.fromAsync(
        run([
          { id: 1, value: 10 },
          { id: 2, value: 30 },
          { id: 3, value: 0 },
          { id: 4, value: 60 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { id: 1, value: 10 },
        { id: 2, value: 30 },
      ]);
    });

    it("treats null as falsy and stops with null=false", async () => {
      const run = compileQuery(parseQuery("| head (value)").ast);
      const results = await Array.fromAsync(
        run([
          { id: 1, value: 10 },
          { id: 2, value: null },
          { id: 3, value: 30 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [{ id: 1, value: 10 }]);
    });

    it("continues past null with null=true", async () => {
      const run = compileQuery(parseQuery("| head null=true (value)").ast);
      const results = await Array.fromAsync(
        run([
          { id: 1, value: 10 },
          { id: 2, value: null },
          { id: 3, value: 0 },
          { id: 4, value: 30 },
        ]),
      );

      assert.partialDeepStrictEqual(results, [
        { id: 1, value: 10 },
        { id: 2, value: null },
      ]);
    });
  });
});
