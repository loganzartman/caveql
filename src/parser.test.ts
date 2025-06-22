import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	parseQuery,
	type SearchCommandAST,
	type WhereCommandAST,
} from "./parser";

describe("parser", () => {
	it("parses basic search with key-value", () => {
		const result = parseQuery("search a=b");
		assert.deepEqual(result, {
			type: "query",
			pipeline: [
				{ type: "search", filters: [{ type: "kv", key: "a", value: "b" }] },
			],
		});
	});

	describe("operator precedence", () => {
		it("handles AND with higher precedence than OR", () => {
			const result = parseQuery("search a=1 and b=2 or c=3");
			const searchCmd = result.pipeline[0] as SearchCommandAST;
			assert.deepEqual(searchCmd.filters[0], {
				type: "or",
				left: {
					type: "and",
					left: { type: "kv", key: "a", value: 1n },
					right: { type: "kv", key: "b", value: 2n },
				},
				right: { type: "kv", key: "c", value: 3n },
			});
		});

		it("handles NOT with higher precedence than AND", () => {
			const result = parseQuery("search not a=1 and b=2");
			const searchCmd = result.pipeline[0] as SearchCommandAST;
			assert.deepEqual(searchCmd.filters[0], {
				type: "and",
				left: {
					type: "not",
					operand: { type: "kv", key: "a", value: 1n },
				},
				right: { type: "kv", key: "b", value: 2n },
			});
		});

		it("handles comparison operators with correct precedence", () => {
			const result = parseQuery("search a=1 > 0 and b=2");
			const searchCmd = result.pipeline[0] as SearchCommandAST;
			assert.deepEqual(searchCmd.filters[0], {
				type: "and",
				left: {
					type: ">",
					left: { type: "kv", key: "a", value: 1n },
					right: 0n,
				},
				right: { type: "kv", key: "b", value: 2n },
			});
		});

		it("respects parentheses for grouping", () => {
			const result = parseQuery("search not (a=1)");
			const searchCmd = result.pipeline[0] as SearchCommandAST;
			assert.deepEqual(searchCmd.filters[0], {
				type: "not",
				operand: { type: "kv", key: "a", value: 1n },
			});
		});
	});

	describe("pipelines", () => {
		it("parses simple pipeline with search and where", () => {
			const result = parseQuery("search a=b | where a<2");
			assert.deepEqual(result, {
				type: "query",
				pipeline: [
					{
						type: "search",
						filters: [{ type: "kv", key: "a", value: "b" }],
					},
					{
						type: "where",
						expr: {
							type: "<",
							left: "a",
							right: 2n,
						},
					},
				],
			});
		});

		it("parses three-command pipeline", () => {
			const result = parseQuery("search a=b | where a<2 | stats");
			assert.deepEqual(result, {
				type: "query",
				pipeline: [
					{
						type: "search",
						filters: [{ type: "kv", key: "a", value: "b" }],
					},
					{
						type: "where",
						expr: {
							type: "<",
							left: "a",
							right: 2n,
						},
					},
					{
						type: "stats",
					},
				],
			});
		});

		it("parses complex expressions in pipeline", () => {
			const result = parseQuery("search x=1 and y=2 | where z>5 or w<10");
			assert.deepEqual(result, {
				type: "query",
				pipeline: [
					{
						type: "search",
						filters: [
							{
								type: "and",
								left: { type: "kv", key: "x", value: 1n },
								right: { type: "kv", key: "y", value: 2n },
							},
						],
					},
					{
						type: "where",
						expr: {
							type: "or",
							left: {
								type: ">",
								left: "z",
								right: 5n,
							},
							right: {
								type: "<",
								left: "w",
								right: 10n,
							},
						},
					},
				],
			});
		});
	});

	describe("expressions", () => {
		it("parses simple identifiers in where clauses", () => {
			const result = parseQuery("where a");
			const whereCmd = result.pipeline[0] as WhereCommandAST;
			assert.deepEqual(whereCmd, {
				type: "where",
				expr: "a",
			});
		});

		it("parses numeric literals in where clauses", () => {
			const result = parseQuery("where 123");
			const whereCmd = result.pipeline[0] as WhereCommandAST;
			assert.deepEqual(whereCmd, {
				type: "where",
				expr: 123n,
			});
		});

		it("parses quoted strings", () => {
			const result = parseQuery('where "hello"');
			const whereCmd = result.pipeline[0] as WhereCommandAST;
			assert.deepEqual(whereCmd, {
				type: "where",
				expr: "hello",
			});
		});
	});

	describe("individual commands", () => {
		it("parses stats command", () => {
			const result = parseQuery("stats");
			assert.deepEqual(result, {
				type: "query",
				pipeline: [{ type: "stats" }],
			});
		});

		it("parses where command with comparison", () => {
			const result = parseQuery("where a >= 5");
			const whereCmd = result.pipeline[0] as WhereCommandAST;
			assert.deepEqual(whereCmd, {
				type: "where",
				expr: {
					type: ">=",
					left: "a",
					right: 5n,
				},
			});
		});
	});
});
