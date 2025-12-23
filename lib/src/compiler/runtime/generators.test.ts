import assert from "node:assert";
import { describe, it } from "node:test";
import { joinAsyncGenerators, splitAsyncGenerator } from "./generators";

describe("splitAsyncGenerator", () => {
  it("should split an async generator into multiple async generators", async () => {
    const gen = async function* () {
      yield 1;
      yield 2;
      yield 3;
      yield 4;
    };
    const slices = splitAsyncGenerator(gen(), 3);

    assert.equal((await slices[0].next()).value, 1);
    assert.equal((await slices[1].next()).value, 2);
    assert.equal((await slices[2].next()).value, 3);
    assert.equal((await slices[0].next()).value, 4);
  });
});

describe("joinAsyncGenerators", () => {
  it("should join multiple async generators into a single async generator", async () => {
    const gen1 = async function* () {
      yield 1;
      yield 2;
    };
    const gen2 = async function* () {
      yield 3;
      yield 4;
    };

    const joined = joinAsyncGenerators([gen1(), gen2()]);
    const result = await Array.fromAsync(joined);
    assert.ok(
      (result[0] === 1 && result[1] === 3) ||
        (result[0] === 3 && result[1] === 1),
    );
    assert.ok(
      (result[2] === 2 && result[3] === 4) ||
        (result[2] === 4 && result[3] === 2),
    );
    assert.equal(result.length, 4);
  });
});

describe("integration", () => {
  it("should split and join an async generator", async () => {
    const gen = async function* () {
      yield 1;
      yield 2;
      yield 3;
      yield 4;
    };
    const slices = splitAsyncGenerator(gen(), 2);
    const joined = joinAsyncGenerators(slices);
    const result = await Array.fromAsync(joined);
    assert.deepEqual(result, [1, 2, 3, 4]);
  });
});
