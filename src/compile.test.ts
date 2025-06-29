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
	});
});
