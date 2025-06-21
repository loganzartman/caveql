import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQuery } from "./parser";

describe("parser", () => {
	it("works", () => {
		const result = parseQuery("search a=b");
		assert.deepEqual(result, {
			type: "query",
			pipeline: [
				{ type: "search", filters: [{ type: "kv", key: "a", value: "b" }] },
			],
		});
	});
});
