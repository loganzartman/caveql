import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQuery } from "../parser";
import { compileQuery } from "./compileQuery";

describe("compiler", () => {
  describe("search", () => {
    it("matches bare words", () => {
      const run = compileQuery(parseQuery("search US").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ country: "US", value: 1 }]);
    });

    it("matches bare numbers", () => {
      const run = compileQuery(parseQuery("search 1").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ country: "US", value: 1 }]);
    });

    it("is case insensitive for bare words", () => {
      const run = compileQuery(parseQuery("search us").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ country: "US", value: 1 }]);
    });

    it("coerces numbers to strings", () => {
      const run = compileQuery(parseQuery("search 1").ast);
      const results = [
        ...run([
          { country: "CA", value: "2" },
          { country: "US", value: "1" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ country: "US", value: "1" }]);
    });

    it("filters by comparison", () => {
      const run = compileQuery(parseQuery("search value <= 2").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "CA", value: 2 },
        { country: "US", value: 1 },
      ]);
    });

    it("filters by key/value", () => {
      const run = compileQuery(parseQuery("search country = 'CA'").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ country: "CA", value: 2 }]);
    });

    it("is case insensitive for key/value", () => {
      const run = compileQuery(parseQuery("search country = 'ca'").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ country: "CA", value: 2 }]);
    });

    it("is case insensitive for inequality key/value", () => {
      const run = compileQuery(parseQuery("search country != 'ca'").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "AUS", value: 3 },
        { country: "US", value: 1 },
      ]);
    });

    it("lets boolean OR combine bare words", () => {
      const run = compileQuery(parseQuery("search US OR CA").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "CA", value: 2 },
        { country: "US", value: 1 },
      ]);
    });

    it("lets boolean AND combine bare words", () => {
      const run = compileQuery(parseQuery("search US AND WA").ast);
      const results = [
        ...run([
          { country: "US", state: "HI" },
          { country: "US", state: "WA" },
          { country: "CA", state: "BC" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ country: "US", state: "WA" }]);
    });

    it("lets boolean NOT exclude bare words", () => {
      const run = compileQuery(parseQuery("search NOT US").ast);
      const results = [
        ...run([
          { country: "US", state: "HI" },
          { country: "US", state: "WA" },
          { country: "CA", state: "BC" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ country: "CA", state: "BC" }]);
    });
  });

  describe("where", () => {
    it("filters records by expression", () => {
      const run = compileQuery(parseQuery("where value > 2").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ country: "AUS", value: 3 }]);
    });
  });

  describe("sort", () => {
    it("sorts records with numeric values", () => {
      const run = compileQuery(parseQuery("| sort value").ast);
      const results = [
        ...run([
          { country: "AUS", value: 2n },
          { country: "CA", value: 1 },
          { country: "US", value: 3 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "CA", value: 1 },
        { country: "AUS", value: 2n },
        { country: "US", value: 3 },
      ]);
    });

    it("sorts records with string values, descending", () => {
      const run = compileQuery(parseQuery("| sort -country").ast);
      const results = [
        ...run([
          { country: "AUS", value: 2 },
          { country: "CA", value: 1 },
          { country: "US", value: 3 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "US", value: 3 },
        { country: "CA", value: 1 },
        { country: "AUS", value: 2 },
      ]);
    });

    it("sorts records by two fields", () => {
      const run = compileQuery(parseQuery("| sort country, value").ast);
      const results = [
        ...run([
          { country: "US", value: 2 },
          { country: "US", value: 1 },
          { country: "AUS", value: 3 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "AUS", value: 3 },
        { country: "US", value: 1 },
        { country: "US", value: 2 },
      ]);
    });

    it("sorts records by heterogeneous fields", () => {
      const run = compileQuery(parseQuery("| sort value").ast);
      const results = [
        ...run([
          { country: "A", value: "hello" },
          { country: "B", value: 1 },
          { country: "C", value: "$" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "C", value: "$" },
        { country: "B", value: 1 },
        { country: "A", value: "hello" },
      ]);
    });

    it("sorts records by explicit comparator", () => {
      const run = compileQuery(parseQuery("| sort -str(value)").ast);
      const results = [
        ...run([
          { country: "C", value: 10000 },
          { country: "A", value: 300 },
          { country: "B", value: 2000 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "A", value: 300 },
        { country: "B", value: 2000 },
        { country: "C", value: 10000 },
      ]);
    });

    it("returns first N records from sorted order for count N", () => {
      const run = compileQuery(parseQuery("| sort 3 value").ast);
      const results = [
        ...run([
          { country: "A", value: 6 },
          { country: "B", value: 3 },
          { country: "C", value: 1 },
          { country: "D", value: 5 },
          { country: "E", value: 4 },
          { country: "F", value: 2 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "C", value: 1 },
        { country: "F", value: 2 },
        { country: "B", value: 3 },
      ]);
    });
  });

  describe("fields", () => {
    it("reorders fields in records", () => {
      const run = compileQuery(parseQuery("| fields population, country").ast);
      const results = [
        ...run([
          { country: "AUS", population: 1000 },
          { country: "CA", population: 500 },
          { country: "US", population: 300 },
        ]),
      ];

      assert.partialDeepStrictEqual(
        Object.values(results).map((v) => Object.keys(v)),
        [
          ["population", "country"],
          ["population", "country"],
          ["population", "country"],
        ],
      );
    });

    it("removes specified fields from records", () => {
      const run = compileQuery(parseQuery("| fields -country, population").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3, population: 1000, food: "pavlova" },
          { country: "CA", value: 2, population: 500, food: "poutine" },
          { country: "US", value: 1, population: 300, food: "pizza" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { value: 3, food: "pavlova" },
        { value: 2, food: "poutine" },
        { value: 1, food: "pizza" },
      ]);
    });

    it("retains specified fields in records", () => {
      const run = compileQuery(parseQuery("| fields country, food").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3, population: 1000, food: "pavlova" },
          { country: "CA", value: 2, population: 500, food: "poutine" },
          { country: "US", value: 1, population: 300, food: "pizza" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "AUS", food: "pavlova" },
        { country: "CA", food: "poutine" },
        { country: "US", food: "pizza" },
      ]);
    });

    it("removes specified deep fields from records", () => {
      const run = compileQuery(parseQuery("| fields -population.count").ast);
      const results = [
        ...run([
          { country: "AUS", value: 3, population: { count: 1000 } },
          { country: "CA", value: 2, population: { count: 500 } },
          { country: "US", value: 1, population: { count: 300 } },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "AUS", value: 3, population: {} },
        { country: "CA", value: 2, population: {} },
        { country: "US", value: 1, population: {} },
      ]);
    });

    it("retains specified deep fields in records", () => {
      const run = compileQuery(
        parseQuery("| fields country, population.count").ast,
      );
      const results = [
        ...run([
          {
            country: "AUS",
            value: 3,
            population: { count: 1000, type: "int" },
          },
          { country: "CA", value: 2, population: { count: 500, type: "int" } },
          { country: "US", value: 1, population: { count: 300, type: "int" } },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { country: "AUS", population: { count: 1000 } },
        { country: "CA", population: { count: 500 } },
        { country: "US", population: { count: 300 } },
      ]);
    });
  });

  describe("stats", () => {
    it("aggregates with count function", () => {
      const run = compileQuery(parseQuery("stats count(events)").ast);
      const results = [
        ...run([
          { events: 1, country: "US" },
          { events: 2, country: "CA" },
          { events: 3, country: "US" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ "count(events)": 3 }]);
    });

    it("aggregates with field renaming using 'as' keyword", () => {
      const run = compileQuery(
        parseQuery("stats count(events) as total_events").ast,
      );
      const results = [
        ...run([
          { events: 1, country: "US" },
          { events: 2, country: "CA" },
          { events: 3, country: "US" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ total_events: 3 }]);
    });

    it("aggregates with multiple functions and field renaming", () => {
      const run = compileQuery(
        parseQuery("stats count(events) as total, avg(price) as avg_price").ast,
      );
      const results = [
        ...run([
          { events: 1, price: 10, country: "US" },
          { events: 2, price: 20, country: "CA" },
          { events: 3, price: 30, country: "US" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ total: 3, avg_price: 20 }]);
    });

    it("handles field names with parentheses in aggregation functions", () => {
      const run = compileQuery(
        parseQuery("stats count(field(with)parens) as renamed").ast,
      );
      const results = [
        ...run([
          { "field(with)parens": 1 },
          { "field(with)parens": 2 },
          { "field(with)parens": 3 },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [{ renamed: 3 }]);
    });
  });

  describe("streamstats", () => {
    it("provides running aggregation with field renaming", () => {
      const run = compileQuery(
        parseQuery("streamstats count(events) as running_total").ast,
      );
      const results = [
        ...run([
          { events: 1, country: "US" },
          { events: 2, country: "CA" },
          { events: 3, country: "US" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { events: 1, country: "US", running_total: 1 },
        { events: 2, country: "CA", running_total: 2 },
        { events: 3, country: "US", running_total: 3 },
      ]);
    });

    it("provides running aggregation with multiple functions and field renaming", () => {
      const run = compileQuery(
        parseQuery(
          "streamstats count(events) as total, avg(price) as avg_price",
        ).ast,
      );
      const results = [
        ...run([
          { events: 1, price: 10, country: "US" },
          { events: 2, price: 20, country: "CA" },
          { events: 3, price: 30, country: "US" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { events: 1, price: 10, country: "US", total: 1, avg_price: 10 },
        { events: 2, price: 20, country: "CA", total: 2, avg_price: 15 },
        { events: 3, price: 30, country: "US", total: 3, avg_price: 20 },
      ]);
    });

    it("handles field names with parentheses in running aggregation", () => {
      const run = compileQuery(
        parseQuery("streamstats count(field(with)parens) as running_count").ast,
      );
      const results = [
        ...run([
          { "field(with)parens": 1, id: "a" },
          { "field(with)parens": 2, id: "b" },
          { "field(with)parens": 3, id: "c" },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { "field(with)parens": 1, id: "a", running_count: 1 },
        { "field(with)parens": 2, id: "b", running_count: 2 },
        { "field(with)parens": 3, id: "c", running_count: 3 },
      ]);
    });
  });

  describe("eval", () => {
    it("can set a field to a literal string", () => {
      const run = compileQuery(parseQuery("| eval newField='hey'").ast);
      const results = [...run([{ id: 1 }, { id: 2 }])];

      assert.partialDeepStrictEqual(results, [
        { id: 1, newField: "hey" },
        { id: 2, newField: "hey" },
      ]);
    });

    it("can deeply set a new field to a literal string", () => {
      const run = compileQuery(parseQuery("| eval newField.nested='hey'").ast);
      const results = [...run([{ id: 1 }, { id: 2 }])];

      assert.partialDeepStrictEqual(results, [
        { id: 1, newField: { nested: "hey" } },
        { id: 2, newField: { nested: "hey" } },
      ]);
    });

    it("can deeply set an existing field to a literal string", () => {
      const run = compileQuery(parseQuery("| eval newField.nested='hey'").ast);
      const results = [
        ...run([
          { id: 1, newField: { nested: "old", test: "value" } },
          { id: 2, newField: { nested: "old", test: "value" } },
        ]),
      ];

      assert.partialDeepStrictEqual(results, [
        { id: 1, newField: { nested: "hey", test: "value" } },
        { id: 2, newField: { nested: "hey", test: "value" } },
      ]);
    });

    it("can be used to rename a field", () => {
      const run = compileQuery(parseQuery("| eval newField=oldField").ast);
      const results = [...run([{ oldField: "value" }])];

      assert.partialDeepStrictEqual(results, [
        { newField: "value", oldField: "value" },
      ]);
    });
  });

  describe("rex", () => {
    it("can extract a field with regex", () => {
      const run = compileQuery(
        parseQuery("| rex field=name '(?<name2>j(?:ay|ules))'").ast,
      );
      const results = [
        ...run([{ name: "jay" }, { name: "jerry" }, { name: "jules" }]),
      ];

      assert.partialDeepStrictEqual(results, [
        { name: "jay", name2: "jay" },
        { name: "jerry" },
        { name: "jules", name2: "jules" },
      ]);
    });

    it("can replace a needle with mode=sed", () => {
      const run = compileQuery(
        parseQuery("| rex field=name mode=sed 's/ay/ames/'").ast,
      );
      const results = [
        ...run([{ name: "jay" }, { name: "jerry" }, { name: "jules" }]),
      ];

      assert.partialDeepStrictEqual(results, [
        { name: "james" },
        { name: "jerry" },
        { name: "jules" },
      ]);
    });

    it("supports weird delimiters and escapes with mode=sed", () => {
      const run = compileQuery(
        parseQuery("| rex field=name mode=sed 's|ay\\|erry|ames|'").ast,
      );
      const results = [
        ...run([{ name: "jay" }, { name: "jerry" }, { name: "jules" }]),
      ];

      assert.partialDeepStrictEqual(results, [
        { name: "james" },
        { name: "james" },
        { name: "jules" },
      ]);
    });

    it("defaults to field=_raw", () => {
      const run = compileQuery(parseQuery("| rex '(?<name>j(?:ay|ules))'").ast);
      const results = [
        ...run([{ _raw: "jay" }, { _raw: "jerry" }, { _raw: "jules" }]),
      ];

      assert.partialDeepStrictEqual(results, [
        { _raw: "jay", name: "jay" },
        { _raw: "jerry" },
        { _raw: "jules", name: "jules" },
      ]);
    });
  });
});
