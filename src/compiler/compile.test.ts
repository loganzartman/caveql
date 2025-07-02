import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQuery } from "../parser";
import { compileQuery } from "./compileQuery";

describe("compiler", () => {
  describe("search", () => {
    it("matches bare words", () => {
      const run = compileQuery(parseQuery("search US"));
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.deepEqual(results, [{ country: "US", value: 1 }]);
    });

    it("matches bare numbers", () => {
      const run = compileQuery(parseQuery("search 1"));
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.deepEqual(results, [{ country: "US", value: 1 }]);
    });

    it("is case insensitive for bare words", () => {
      const run = compileQuery(parseQuery("search us"));
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.deepEqual(results, [{ country: "US", value: 1 }]);
    });

    it("coerces numbers to strings", () => {
      const run = compileQuery(parseQuery("search 1"));
      const results = [
        ...run([
          { country: "CA", value: "2" },
          { country: "US", value: "1" },
        ]),
      ];

      assert.deepEqual(results, [{ country: "US", value: "1" }]);
    });

    it("filters by comparison", () => {
      const run = compileQuery(parseQuery("search value <= 2"));
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.deepEqual(results, [
        { country: "CA", value: 2 },
        { country: "US", value: 1 },
      ]);
    });

    it("filters by key/value", () => {
      const run = compileQuery(parseQuery("search country = 'CA'"));
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.deepEqual(results, [{ country: "CA", value: 2 }]);
    });

    it("is case insensitive for key/value", () => {
      const run = compileQuery(parseQuery("search country = 'ca'"));
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.deepEqual(results, [{ country: "CA", value: 2 }]);
    });

    it("is case insensitive for inequality key/value", () => {
      const run = compileQuery(parseQuery("search country != 'ca'"));
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.deepEqual(results, [
        { country: "AUS", value: 3 },
        { country: "US", value: 1 },
      ]);
    });

    it("lets boolean OR combine bare words", () => {
      const run = compileQuery(parseQuery("search US OR CA"));
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.deepEqual(results, [
        { country: "CA", value: 2 },
        { country: "US", value: 1 },
      ]);
    });

    it("lets boolean AND combine bare words", () => {
      const run = compileQuery(parseQuery("search US AND WA"));
      const results = [
        ...run([
          { country: "US", state: "HI" },
          { country: "US", state: "WA" },
          { country: "CA", state: "BC" },
        ]),
      ];

      assert.deepEqual(results, [{ country: "US", state: "WA" }]);
    });

    it("lets boolean NOT exclude bare words", () => {
      const run = compileQuery(parseQuery("search NOT US"));
      const results = [
        ...run([
          { country: "US", state: "HI" },
          { country: "US", state: "WA" },
          { country: "CA", state: "BC" },
        ]),
      ];

      assert.deepEqual(results, [{ country: "CA", state: "BC" }]);
    });
  });

  describe("where", () => {
    it("filters records by expression", () => {
      const run = compileQuery(parseQuery("where value > 2"));
      const results = [
        ...run([
          { country: "AUS", value: 3 },
          { country: "CA", value: 2 },
          { country: "US", value: 1 },
        ]),
      ];

      assert.deepEqual(results, [{ country: "AUS", value: 3 }]);
    });
  });

  describe("sort", () => {
    it("sorts records with numeric values", () => {
      const run = compileQuery(parseQuery("| sort value"));
      const results = [
        ...run([
          { country: "AUS", value: 2n },
          { country: "CA", value: 1 },
          { country: "US", value: 3 },
        ]),
      ];

      assert.deepEqual(results, [
        { country: "CA", value: 1 },
        { country: "AUS", value: 2n },
        { country: "US", value: 3 },
      ]);
    });

    it("sorts records with string values, descending", () => {
      const run = compileQuery(parseQuery("| sort -country"));
      const results = [
        ...run([
          { country: "AUS", value: 2 },
          { country: "CA", value: 1 },
          { country: "US", value: 3 },
        ]),
      ];

      assert.deepEqual(results, [
        { country: "US", value: 3 },
        { country: "CA", value: 1 },
        { country: "AUS", value: 2 },
      ]);
    });

    it("sorts records by two fields", () => {
      const run = compileQuery(parseQuery("| sort country, value"));
      const results = [
        ...run([
          { country: "US", value: 2 },
          { country: "US", value: 1 },
          { country: "AUS", value: 3 },
        ]),
      ];

      assert.deepEqual(results, [
        { country: "AUS", value: 3 },
        { country: "US", value: 1 },
        { country: "US", value: 2 },
      ]);
    });

    it("sorts records by heterogeneous fields", () => {
      const run = compileQuery(parseQuery("| sort value"));
      const results = [
        ...run([
          { country: "A", value: "hello" },
          { country: "B", value: 1 },
          { country: "C", value: "$" },
        ]),
      ];

      assert.deepEqual(results, [
        { country: "C", value: "$" },
        { country: "B", value: 1 },
        { country: "A", value: "hello" },
      ]);
    });

    it("sorts records by explicit comparator", () => {
      const run = compileQuery(parseQuery("| sort -str(value)"));
      const results = [
        ...run([
          { country: "C", value: 10000 },
          { country: "A", value: 300 },
          { country: "B", value: 2000 },
        ]),
      ];

      assert.deepEqual(results, [
        { country: "A", value: 300 },
        { country: "B", value: 2000 },
        { country: "C", value: 10000 },
      ]);
    });

    it("returns first N records from sorted order for count N", () => {
      const run = compileQuery(parseQuery("| sort 3 value"));
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

      assert.deepEqual(results, [
        { country: "C", value: 1 },
        { country: "F", value: 2 },
        { country: "B", value: 3 },
      ]);
    });
  });

  describe("fields", () => {
    it("reorders fields in records", () => {
      const run = compileQuery(parseQuery("| fields population, country"));
      const results = [
        ...run([
          { country: "AUS", population: 1000 },
          { country: "CA", population: 500 },
          { country: "US", population: 300 },
        ]),
      ];

      assert.deepEqual(
        Object.values(results).map((v) => Object.keys(v)),
        [
          ["population", "country"],
          ["population", "country"],
          ["population", "country"],
        ],
      );
    });

    it("removes specified fields from records", () => {
      const run = compileQuery(parseQuery("| fields -country, population"));
      const results = [
        ...run([
          { country: "AUS", value: 3, population: 1000, food: "pavlova" },
          { country: "CA", value: 2, population: 500, food: "poutine" },
          { country: "US", value: 1, population: 300, food: "pizza" },
        ]),
      ];

      assert.deepEqual(results, [
        { value: 3, food: "pavlova" },
        { value: 2, food: "poutine" },
        { value: 1, food: "pizza" },
      ]);
    });

    it("retains specified fields in records", () => {
      const run = compileQuery(parseQuery("| fields country, food"));
      const results = [
        ...run([
          { country: "AUS", value: 3, population: 1000, food: "pavlova" },
          { country: "CA", value: 2, population: 500, food: "poutine" },
          { country: "US", value: 1, population: 300, food: "pizza" },
        ]),
      ];

      assert.deepEqual(results, [
        { country: "AUS", food: "pavlova" },
        { country: "CA", food: "poutine" },
        { country: "US", food: "pizza" },
      ]);
    });

    it("removes specified deep fields from records", () => {
      const run = compileQuery(parseQuery("| fields -population.count"));
      const results = [
        ...run([
          { country: "AUS", value: 3, population: { count: 1000 } },
          { country: "CA", value: 2, population: { count: 500 } },
          { country: "US", value: 1, population: { count: 300 } },
        ]),
      ];

      assert.deepEqual(results, [
        { country: "AUS", value: 3, population: {} },
        { country: "CA", value: 2, population: {} },
        { country: "US", value: 1, population: {} },
      ]);
    });

    it("retains specified deep fields in records", () => {
      const run = compileQuery(
        parseQuery("| fields country, population.count"),
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

      assert.deepEqual(results, [
        { country: "AUS", population: { count: 1000 } },
        { country: "CA", population: { count: 500 } },
        { country: "US", population: { count: 300 } },
      ]);
    });
  });

  describe("eval", () => {
    it("can set a field to a literal string", () => {
      const run = compileQuery(parseQuery("| eval newField='hey'"));
      const results = [...run([{ id: 1 }, { id: 2 }])];

      assert.deepEqual(results, [
        { id: 1, newField: "hey" },
        { id: 2, newField: "hey" },
      ]);
    });

    it("can deeply set a new field to a literal string", () => {
      const run = compileQuery(parseQuery("| eval newField.nested='hey'"));
      const results = [...run([{ id: 1 }, { id: 2 }])];

      assert.deepEqual(results, [
        { id: 1, newField: { nested: "hey" } },
        { id: 2, newField: { nested: "hey" } },
      ]);
    });

    it("can deeply set an existing field to a literal string", () => {
      const run = compileQuery(parseQuery("| eval newField.nested='hey'"));
      const results = [
        ...run([
          { id: 1, newField: { nested: "old", test: "value" } },
          { id: 2, newField: { nested: "old", test: "value" } },
        ]),
      ];

      assert.deepEqual(results, [
        { id: 1, newField: { nested: "hey", test: "value" } },
        { id: 2, newField: { nested: "hey", test: "value" } },
      ]);
    });

    it("can be used to rename a field", () => {
      const run = compileQuery(parseQuery("| eval newField=oldField"));
      const results = [...run([{ oldField: "value" }])];

      assert.deepEqual(results, [{ newField: "value", oldField: "value" }]);
    });
  });
});
