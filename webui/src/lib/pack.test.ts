import assert from "node:assert";
import { describe, it } from "node:test";
import { packString, unpackString } from "./pack";

describe("pack e2e", () => {
  it("packs and unpacks a string to the same value", async () => {
    const input = "Hello, world!";
    const packed = await packString(input);
    const unpacked = await unpackString(packed);
    assert.strictEqual(unpacked, input);
  });

  it("packs and unpacks JSON to the same value", async () => {
    const input = JSON.stringify({ foo: { bar: [1, 2, 3, 4] } });
    const packed = await packString(input);
    const unpacked = await unpackString(packed);
    assert.strictEqual(unpacked, input);
  });

  it("packs the string to fewer characters than the input", async () => {
    const input = JSON.stringify({ foo: { bar: [1, 2, 3, 4] } });
    const packed = await packString(input);
    assert(packed.length < input.length);
  });

  it("test", async () => {
    console.log(
      await unpackString(
        "𢉸蚫苈菌缭挭廍謩𥑈𥌯𣜫椵攰𦯠蚪挨缩𥉍挭𠩉巉䨤褫馀𥅒𓄒弔恭徴徴䈀䨔ᗄ",
      ),
    );
  });
});
