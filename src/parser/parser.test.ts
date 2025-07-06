import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FieldsCommandAST } from "./command/parseFieldsCommand";
import type { SortCommandAST } from "./command/parseSortCommand";
import {
  type EvalCommandAST,
  parseQuery,
  type SearchCommandAST,
  type WhereCommandAST,
} from "./index";

describe("parser", () => {
  it("parses basic search with key-value", () => {
    const result = parseQuery("search a=b").ast;
    assert.deepEqual(result, {
      type: "query",
      pipeline: [
        {
          type: "search",
          filters: [
            {
              type: "binary-op",
              op: "=",
              left: { type: "string", quoted: false, value: "a" },
              right: { type: "string", quoted: false, value: "b" },
            },
          ],
        },
      ],
    });
  });

  describe("strings", () => {
    it("handles a double-quoted string", () => {
      const result = parseQuery(`"hello world!"`).ast;
      assert.deepEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "string",
                quoted: true,
                value: "hello world!",
              },
            ],
          },
        ],
      });
    });

    it("handles a single-quoted string", () => {
      const result = parseQuery(`'hello world!'`).ast;
      assert.deepEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "string",
                quoted: true,
                value: "hello world!",
              },
            ],
          },
        ],
      });
    });

    it("handles a bare string", () => {
      const result = parseQuery("h3llo-world$").ast;
      assert.deepEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "string",
                quoted: false,
                value: "h3llo-world$",
              },
            ],
          },
        ],
      });
    });
  });

  describe("search", () => {
    it("parses multiple search terms as separate filters", () => {
      const result = parseQuery("search a=1 and b=2 or c=3").ast;
      const searchCmd = result.pipeline[0] as SearchCommandAST;
      // In Splunk, this would be searching for records containing "a=1", "and", "b=2", "or", "c=3" as separate terms
      assert.equal(searchCmd.filters.length, 5);
      assert.deepEqual(searchCmd.filters[0], {
        type: "binary-op",
        op: "=",
        left: { type: "string", quoted: false, value: "a" },
        right: { type: "number", value: 1n },
      });
      assert.deepEqual(searchCmd.filters[1], {
        type: "string",
        quoted: false,
        value: "and",
      });
      assert.deepEqual(searchCmd.filters[2], {
        type: "binary-op",
        op: "=",
        left: { type: "string", quoted: false, value: "b" },
        right: { type: "number", value: 2n },
      });
      assert.deepEqual(searchCmd.filters[3], {
        type: "string",
        quoted: false,
        value: "or",
      });
      assert.deepEqual(searchCmd.filters[4], {
        type: "binary-op",
        op: "=",
        left: { type: "string", quoted: false, value: "c" },
        right: { type: "number", value: 3n },
      });
    });

    it("parses logical expressions using uppercase operators", () => {
      const result = parseQuery("search a=1 AND b=2 OR NOT c=3").ast;
      const searchCmd = result.pipeline[0] as SearchCommandAST;
      assert.equal(searchCmd.filters.length, 1);
      assert.deepEqual(searchCmd.filters[0], {
        type: "binary-op",
        op: "OR",
        left: {
          type: "binary-op",
          op: "AND",
          left: {
            type: "binary-op",
            op: "=",
            left: { type: "string", quoted: false, value: "a" },
            right: { type: "number", value: 1n },
          },
          right: {
            type: "binary-op",
            op: "=",
            left: { type: "string", quoted: false, value: "b" },
            right: { type: "number", value: 2n },
          },
        },
        right: {
          type: "unary-op",
          op: "NOT",
          operand: {
            type: "binary-op",
            op: "=",
            left: { type: "string", quoted: false, value: "c" },
            right: { type: "number", value: 3n },
          },
        },
      });
    });

    it("respects parentheses for grouping", () => {
      const result = parseQuery("search NOT (a=1)").ast;
      const searchCmd = result.pipeline[0] as SearchCommandAST;
      assert.deepEqual(searchCmd.filters[0], {
        type: "unary-op",
        op: "NOT",
        operand: {
          type: "binary-op",
          op: "=",
          left: { type: "string", quoted: false, value: "a" },
          right: { type: "number", value: 1n },
        },
      });
    });
  });

  describe("pipelines", () => {
    it("parses simple pipeline with search and where", () => {
      const result = parseQuery("search a=b | where a<2").ast;
      assert.deepEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "binary-op",
                op: "=",
                left: { type: "string", quoted: false, value: "a" },
                right: { type: "string", quoted: false, value: "b" },
              },
            ],
          },
          {
            type: "where",
            expr: {
              type: "binary-op",
              op: "<",
              left: { type: "string", quoted: false, value: "a" },
              right: { type: "number", value: 2n },
            },
          },
        ],
      });
    });

    it("allows bare search as first command", () => {
      const result = parseQuery("a<b AND c=d").ast;
      assert.deepEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "binary-op",
                op: "AND",
                left: {
                  type: "binary-op",
                  op: "<",
                  left: { type: "string", quoted: false, value: "a" },
                  right: { type: "string", quoted: false, value: "b" },
                },
                right: {
                  type: "binary-op",
                  op: "=",
                  left: { type: "string", quoted: false, value: "c" },
                  right: { type: "string", quoted: false, value: "d" },
                },
              },
            ],
          },
        ],
      });
    });

    it("parses three-command pipeline", () => {
      const result = parseQuery("search a=b | where a<2 | stats").ast;
      assert.deepEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "binary-op",
                op: "=",
                left: { type: "string", quoted: false, value: "a" },
                right: { type: "string", quoted: false, value: "b" },
              },
            ],
          },
          {
            type: "where",
            expr: {
              type: "binary-op",
              op: "<",
              left: { type: "string", quoted: false, value: "a" },
              right: { type: "number", value: 2n },
            },
          },
          {
            type: "stats",
            aggregations: [],
          },
        ],
      });
    });

    it("parses complex expressions in pipeline", () => {
      const result = parseQuery("search x=1 and y=2 | where z>5 or w<10").ast;
      assert.deepEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "binary-op",
                op: "=",
                left: { type: "string", quoted: false, value: "x" },
                right: { type: "number", value: 1n },
              },
              {
                type: "string",
                quoted: false,
                value: "and",
              },
              {
                type: "binary-op",
                op: "=",
                left: { type: "string", quoted: false, value: "y" },
                right: { type: "number", value: 2n },
              },
            ],
          },
          {
            type: "where",
            expr: {
              type: "binary-op",
              op: "or",
              left: {
                type: "binary-op",
                op: ">",
                left: { type: "string", quoted: false, value: "z" },
                right: { type: "number", value: 5n },
              },
              right: {
                type: "binary-op",
                op: "<",
                left: { type: "string", quoted: false, value: "w" },
                right: { type: "number", value: 10n },
              },
            },
          },
        ],
      });
    });
  });

  describe("expressions", () => {
    it("parses simple identifiers in where clauses", () => {
      const result = parseQuery("where a").ast;
      const whereCmd = result.pipeline[0] as WhereCommandAST;
      assert.deepEqual(whereCmd, {
        type: "where",
        expr: { type: "string", quoted: false, value: "a" },
      });
    });

    it("parses numeric literals in where clauses", () => {
      const result = parseQuery("where 123").ast;
      const whereCmd = result.pipeline[0] as WhereCommandAST;
      assert.deepEqual(whereCmd, {
        type: "where",
        expr: { type: "number", value: 123n },
      });
    });

    it("parses quoted strings", () => {
      const result = parseQuery('where "hello"').ast;
      const whereCmd = result.pipeline[0] as WhereCommandAST;
      assert.deepEqual(whereCmd, {
        type: "where",
        expr: { type: "string", quoted: true, value: "hello" },
      });
    });
  });

  describe("individual commands", () => {
    it("parses stats command", () => {
      const result = parseQuery("stats").ast;
      assert.deepEqual(result, {
        type: "query",
        pipeline: [{ type: "stats", aggregations: [] }],
      });
    });

    it("parses where command with comparison", () => {
      const result = parseQuery("where a >= 5").ast;
      const whereCmd = result.pipeline[0] as WhereCommandAST;
      assert.deepEqual(whereCmd, {
        type: "where",
        expr: {
          type: "binary-op",
          op: ">=",
          left: { type: "string", quoted: false, value: "a" },
          right: { type: "number", value: 5n },
        },
      });
    });
  });

  describe("operator case sensitivity", () => {
    it("uses uppercase operators (AND, OR, NOT) in search command comparison expressions", () => {
      const result = parseQuery("search a=1 AND b=2 OR NOT c=3").ast;
      const searchCmd = result.pipeline[0] as SearchCommandAST;
      assert.deepEqual(searchCmd.filters[0], {
        type: "binary-op",
        op: "OR",
        left: {
          type: "binary-op",
          op: "AND",
          left: {
            type: "binary-op",
            op: "=",
            left: { type: "string", quoted: false, value: "a" },
            right: { type: "number", value: 1n },
          },
          right: {
            type: "binary-op",
            op: "=",
            left: { type: "string", quoted: false, value: "b" },
            right: { type: "number", value: 2n },
          },
        },
        right: {
          type: "unary-op",
          op: "NOT",
          operand: {
            type: "binary-op",
            op: "=",
            left: { type: "string", quoted: false, value: "c" },
            right: { type: "number", value: 3n },
          },
        },
      });
    });

    it("uses lowercase operators (and, or, not) in eval command expressions", () => {
      const result = parseQuery("eval result = a=1 and b=2 or not c=3").ast;
      const evalCmd = result.pipeline[0] as EvalCommandAST;
      assert.deepEqual(evalCmd.bindings[0][1], {
        type: "binary-op",
        op: "or",
        left: {
          type: "binary-op",
          op: "and",
          left: {
            type: "binary-op",
            op: "=",
            left: { type: "string", quoted: false, value: "a" },
            right: { type: "number", value: 1n },
          },
          right: {
            type: "binary-op",
            op: "=",
            left: { type: "string", quoted: false, value: "b" },
            right: { type: "number", value: 2n },
          },
        },
        right: {
          type: "unary-op",
          op: "not",
          operand: {
            type: "binary-op",
            op: "=",
            left: { type: "string", quoted: false, value: "c" },
            right: { type: "number", value: 3n },
          },
        },
      });
    });
  });

  describe("sort command", () => {
    it("parses simple sort command", () => {
      const result = parseQuery("| sort a").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.deepEqual(sortCmd, {
        type: "sort",
        count: undefined,
        fields: [
          {
            type: "sort-field",
            field: { type: "string", quoted: false, value: "a" },
            comparator: undefined,
            desc: undefined,
          },
        ],
      });
    });

    it("parses sort with count", () => {
      const result = parseQuery("| sort 1000 a").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.deepEqual(sortCmd, {
        type: "sort",
        count: { type: "number", value: 1000n },
        fields: [
          {
            type: "sort-field",
            field: { type: "string", quoted: false, value: "a" },
            comparator: undefined,
            desc: undefined,
          },
        ],
      });
    });

    it("parses sort with comparator", () => {
      const result = parseQuery("| sort 1000 str(a)").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.deepEqual(sortCmd, {
        type: "sort",
        count: { type: "number", value: 1000n },
        fields: [
          {
            type: "sort-field",
            field: { type: "string", quoted: false, value: "a" },
            comparator: "str",
            desc: undefined,
          },
        ],
      });
    });

    it("parses sort with descending field", () => {
      const result = parseQuery("| sort -a").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.deepEqual(sortCmd, {
        type: "sort",
        count: undefined,
        fields: [
          {
            type: "sort-field",
            field: { type: "string", quoted: false, value: "a" },
            comparator: undefined,
            desc: true,
          },
        ],
      });
    });

    it("parses sort with explicit ascending field", () => {
      const result = parseQuery("| sort +a").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.deepEqual(sortCmd, {
        type: "sort",
        count: undefined,
        fields: [
          {
            type: "sort-field",
            field: { type: "string", quoted: false, value: "a" },
            comparator: undefined,
            desc: false,
          },
        ],
      });
    });

    it("parses sort with comparator and descending field", () => {
      const result = parseQuery("| sort -str(a)").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.deepEqual(sortCmd, {
        type: "sort",
        count: undefined,
        fields: [
          {
            type: "sort-field",
            field: { type: "string", quoted: false, value: "a" },
            comparator: "str",
            desc: true,
          },
        ],
      });
    });

    it("parses complex sort", () => {
      const result = parseQuery("| sort 200 -str(a), beta, auto(gamma)").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.deepEqual(sortCmd, {
        type: "sort",
        count: { type: "number", value: 200n },
        fields: [
          {
            type: "sort-field",
            field: { type: "string", quoted: false, value: "a" },
            comparator: "str",
            desc: true,
          },
          {
            type: "sort-field",
            field: { type: "string", quoted: false, value: "beta" },
            comparator: undefined,
            desc: undefined,
          },
          {
            type: "sort-field",
            field: { type: "string", quoted: false, value: "gamma" },
            comparator: "auto",
            desc: undefined,
          },
        ],
      });
    });
  });

  describe("fields command", () => {
    it("parses simple fields command", () => {
      const result = parseQuery("| fields a").ast;
      const fieldsCmd = result.pipeline[1] as FieldsCommandAST;

      assert.deepEqual(fieldsCmd, {
        type: "fields",
        fields: [{ type: "string", quoted: false, value: "a" }],
        remove: undefined,
      });
    });

    it("parses multiple fields", () => {
      const result = parseQuery("| fields a, b, c").ast;
      const fieldsCmd = result.pipeline[1] as FieldsCommandAST;

      assert.deepEqual(fieldsCmd, {
        type: "fields",
        fields: [
          { type: "string", quoted: false, value: "a" },
          { type: "string", quoted: false, value: "b" },
          { type: "string", quoted: false, value: "c" },
        ],
        remove: undefined,
      });
    });

    it("parses multiple removed fields", () => {
      const result = parseQuery("| fields -a, b, c").ast;
      const fieldsCmd = result.pipeline[1] as FieldsCommandAST;

      assert.deepEqual(fieldsCmd, {
        type: "fields",
        fields: [
          { type: "string", quoted: false, value: "a" },
          { type: "string", quoted: false, value: "b" },
          { type: "string", quoted: false, value: "c" },
        ],
        remove: true,
      });
    });

    it("parses explicit retained fields", () => {
      const result = parseQuery("| fields +a, b, c").ast;
      const fieldsCmd = result.pipeline[1] as FieldsCommandAST;

      assert.deepEqual(fieldsCmd, {
        type: "fields",
        fields: [
          { type: "string", quoted: false, value: "a" },
          { type: "string", quoted: false, value: "b" },
          { type: "string", quoted: false, value: "c" },
        ],
        remove: false,
      });
    });
  });
});
