import assert from "node:assert";
import { describe, it } from "node:test";
import { packString, unpackString } from "./pack";

describe("pack e2e", () => {
  for (const method of ["base64-deflate", "base2048-deflate"] as const) {
    describe(`method ${method}`, () => {
      it("packs and unpacks a string to the same value", async () => {
        const input = "Hello, world!";
        const packed = await packString(input, method);
        const unpacked = await unpackString(packed);
        assert.strictEqual(unpacked, input);
      });

      it("packs and unpacks JSON to the same value", async () => {
        const input = JSON.stringify({ foo: { bar: [1, 2, 3, 4] } });
        const packed = await packString(input, method);
        const unpacked = await unpackString(packed);
        assert.strictEqual(unpacked, input);
      });

      it("packs the string to fewer characters than the input", async () => {
        const input = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const packed = await packString(input, method);
        assert(packed.length < input.length);
      });
    });
  }
});
