import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compilePathGet, compilePathSet } from "./utils";

describe("compilePathGet", () => {
  it("compiles a deep path get expression", () => {
    const result = compilePathGet("obj", "a.b.c");
    assert.strictEqual(result, `(obj)?.["a"]?.["b"]?.["c"]`);
  });

  it("compiles a path get expression with no dots", () => {
    const result = compilePathGet("obj", "a");
    assert.strictEqual(result, `(obj)?.["a"]`);
  });

  it("compiles a path get expression with empty path", () => {
    const result = compilePathGet("obj", "");
    assert.strictEqual(result, `(obj)`);
  });
});

describe("compilePathSet", () => {
  it("compiles a deep path set expression", () => {
    const result = compilePathSet("obj", "a.b.c", "value");

    assert.strictEqual(
      result,
      [
        `(obj)["a"] ??= {};`,
        `(obj)["a"]["b"] ??= {};`,
        `(obj)["a"]["b"]["c"] = (value);`,
      ].join("\n"),
    );
  });

  it("compiles a path set expression with no dots", () => {
    const result = compilePathSet("obj", "a", "value");

    assert.strictEqual(result, `(obj)["a"] = (value);`);
  });

  it("compiles a path set expression with empty path", () => {
    const result = compilePathSet("obj", "", "value");

    assert.strictEqual(result, [`(obj) = (value);`].join("\n"));
  });
});
