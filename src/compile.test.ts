import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileQuery } from "./compile";
import { parseQuery } from "./parser";

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
});
