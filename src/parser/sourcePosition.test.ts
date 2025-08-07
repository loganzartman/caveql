import assert from "node:assert";
import { describe, it } from "node:test";
import { getSourceIndex, getSourcePosition } from "./sourcePosition";

describe("getSourcePosition", () => {
  it("returns 1,1 for empty source", () => {
    const position = getSourcePosition({ source: "", index: 0 });
    assert.strictEqual(position.line, 1);
    assert.strictEqual(position.column, 1);
  });

  it("returns correct line and column for single line", () => {
    const source = "Hello World";
    const position = getSourcePosition({ source, index: 5 });

    assert.strictEqual(position.line, 1);
    assert.strictEqual(position.column, 6);
  });

  it("returns correct line and column for unix newlines", () => {
    //              01234 567890 123456789012345
    const source = "Hello\nWorld\nThis is a test";
    const position = getSourcePosition({ source, index: 12 });

    assert.strictEqual(position.line, 3);
    assert.strictEqual(position.column, 1);
  });

  it("returns correct line and column for windows newlines", () => {
    //              01234 5 678901 2 345678901234567
    const source = "Hello\r\nWorld\r\nThis is a test";
    const position = getSourcePosition({ source, index: 14 });

    assert.strictEqual(position.line, 3);
    assert.strictEqual(position.column, 1);
  });

  it("returns the correct value at the end of a line", () => {
    //              01234 567890 12345
    const source = "Hello\nWorld\ntest";
    const position = getSourcePosition({ source, index: 10 });

    assert.strictEqual(position.line, 2);
    assert.strictEqual(position.column, 5);
  });
});

describe("getSourceIndex", () => {
  it("returns 0 for empty source", () => {
    const source = "";
    const index = getSourceIndex({ source, line: 1, column: 1 });
    assert.strictEqual(index, 0);
  });

  it("returns correct index for single line", () => {
    const source = "Hello World";
    const index = getSourceIndex({ source, line: 1, column: 6 });
    assert.strictEqual(index, 5);
  });

  it("returns correct index for unix newlines", () => {
    const source = "Hello\nWorld\nThis is a test";
    const index = getSourceIndex({ source, line: 3, column: 1 });
    assert.strictEqual(index, 12);
  });

  it("returns correct index for windows newlines", () => {
    const source = "Hello\r\nWorld\r\nThis is a test";
    const index = getSourceIndex({ source, line: 3, column: 1 });
    assert.strictEqual(index, 14);
  });
});
