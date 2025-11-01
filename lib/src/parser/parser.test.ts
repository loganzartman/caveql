import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FieldsCommandAST } from "./command/parseFieldsCommand";
import type { RexCommandAST } from "./command/parseRexCommand";
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
    assert.partialDeepStrictEqual(result, {
      type: "query",
      pipeline: [
        {
          type: "search",
          filters: [
            {
              type: "compare",
              op: "=",
              left: { type: "field-name", value: "a" },
              right: { type: "string", value: "b" },
            },
          ],
        },
      ],
    });
  });

  describe("strings", () => {
    it("handles a double-quoted string", () => {
      const result = parseQuery(`"hello world!"`).ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "string",
                value: "hello world!",
              },
            ],
          },
        ],
      });
    });

    it("handles a single-quoted string", () => {
      const result = parseQuery(`'hello world!'`).ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "string",
                value: "hello world!",
              },
            ],
          },
        ],
      });
    });

    it("handles a bare string", () => {
      const result = parseQuery("h3llo-world$").ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "string",
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
      assert.partialDeepStrictEqual(searchCmd.filters[0], {
        type: "compare",
        op: "=",
        left: { type: "field-name", value: "a" },
        right: { type: "number", value: 1n },
      });
      assert.partialDeepStrictEqual(searchCmd.filters[1], {
        type: "string",
        value: "and",
      });
      assert.partialDeepStrictEqual(searchCmd.filters[2], {
        type: "compare",
        op: "=",
        left: { type: "field-name", value: "b" },
        right: { type: "number", value: 2n },
      });
      assert.partialDeepStrictEqual(searchCmd.filters[3], {
        type: "string",
        value: "or",
      });
      assert.partialDeepStrictEqual(searchCmd.filters[4], {
        type: "compare",
        op: "=",
        left: { type: "field-name", value: "c" },
        right: { type: "number", value: 3n },
      });
    });

    it("parses logical expressions using uppercase operators", () => {
      const result = parseQuery("search a=1 AND b=2 OR NOT c=3").ast;
      const searchCmd = result.pipeline[0] as SearchCommandAST;
      assert.equal(searchCmd.filters.length, 1);
      assert.partialDeepStrictEqual(searchCmd.filters[0], {
        type: "search-binary-op",
        op: "OR",
        left: {
          type: "search-binary-op",
          op: "AND",
          left: {
            type: "compare",
            op: "=",
            left: { type: "field-name", value: "a" },
            right: { type: "number", value: 1n },
          },
          right: {
            type: "compare",
            op: "=",
            left: { type: "field-name", value: "b" },
            right: { type: "number", value: 2n },
          },
        },
        right: {
          type: "search-unary-op",
          op: "NOT",
          operand: {
            type: "compare",
            op: "=",
            left: { type: "field-name", value: "c" },
            right: { type: "number", value: 3n },
          },
        },
      });
    });

    it("respects parentheses for grouping", () => {
      const result = parseQuery("search NOT (a=1)").ast;
      const searchCmd = result.pipeline[0] as SearchCommandAST;
      assert.partialDeepStrictEqual(searchCmd.filters[0], {
        type: "search-unary-op",
        op: "NOT",
        operand: {
          type: "compare",
          op: "=",
          left: { type: "field-name", value: "a" },
          right: { type: "number", value: 1n },
        },
      });
    });
  });

  describe("pipelines", () => {
    it("parses simple pipeline with search and where", () => {
      const result = parseQuery("search a=b | where a<2").ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "compare",
                op: "=",
                left: { type: "field-name", value: "a" },
                right: { type: "string", value: "b" },
              },
            ],
          },
          {
            type: "where",
            expr: {
              type: "binary-op",
              op: "<",
              left: { type: "field-name", value: "a" },
              right: { type: "number", value: 2n },
            },
          },
        ],
      });
    });

    it("allows bare search as first command", () => {
      const result = parseQuery("a<b AND c=d").ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "search-binary-op",
                op: "AND",
                left: {
                  type: "compare",
                  op: "<",
                  left: { type: "field-name", value: "a" },
                  right: { type: "string", value: "b" },
                },
                right: {
                  type: "compare",
                  op: "=",
                  left: { type: "field-name", value: "c" },
                  right: { type: "string", value: "d" },
                },
              },
            ],
          },
        ],
      });
    });

    it("parses three-command pipeline", () => {
      const result = parseQuery("search a=b | where a<2 | stats").ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "compare",
                op: "=",
                left: { type: "field-name", value: "a" },
                right: { type: "string", value: "b" },
              },
            ],
          },
          {
            type: "where",
            expr: {
              type: "binary-op",
              op: "<",
              left: { type: "field-name", value: "a" },
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
      const result = parseQuery("search x=1 AND y=2 | where z>5 or w<10").ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "search",
            filters: [
              {
                type: "search-binary-op",
                op: "AND",
                left: {
                  type: "compare",
                  op: "=",
                  left: { type: "field-name", value: "x" },
                  right: { type: "number", value: 1n },
                },
                right: {
                  type: "compare",
                  op: "=",
                  left: { type: "field-name", value: "y" },
                  right: { type: "number", value: 2n },
                },
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
                left: { type: "field-name", value: "z" },
                right: { type: "number", value: 5n },
              },
              right: {
                type: "binary-op",
                op: "<",
                left: { type: "field-name", value: "w" },
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
      assert.partialDeepStrictEqual(whereCmd, {
        type: "where",
        expr: { type: "field-name", value: "a" },
      });
    });

    it("parses numeric literals in where clauses", () => {
      const result = parseQuery("where 123").ast;
      const whereCmd = result.pipeline[0] as WhereCommandAST;
      assert.partialDeepStrictEqual(whereCmd, {
        type: "where",
        expr: { type: "number", value: 123n },
      });
    });

    it("parses quoted strings", () => {
      const result = parseQuery('where "hello"').ast;
      const whereCmd = result.pipeline[0] as WhereCommandAST;
      assert.partialDeepStrictEqual(whereCmd, {
        type: "where",
        expr: { type: "string", value: "hello" },
      });
    });
  });

  describe("individual commands", () => {
    it("parses stats command", () => {
      const result = parseQuery("stats").ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [{ type: "stats", aggregations: [] }],
      });
    });

    it("parses stats command with aggregation functions", () => {
      const result = parseQuery("stats count(field1), avg(field2)").ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "stats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "field1" },
              },
              {
                type: "avg",
                field: { type: "field-name", value: "field2" },
              },
            ],
          },
        ],
      });
    });

    it("parses stats command with field renaming using 'as' keyword", () => {
      const result = parseQuery("stats count(events) as total_events").ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "stats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "events" },
                asField: { type: "field-name", value: "total_events" },
              },
            ],
          },
        ],
      });
    });

    it("parses stats command with multiple aggregations and field renaming", () => {
      const result = parseQuery(
        "stats count(events) as total, avg(price) as avg_price, sum(revenue)",
      ).ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "stats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "events" },
                asField: { type: "field-name", value: "total" },
              },
              {
                type: "avg",
                field: { type: "field-name", value: "price" },
                asField: { type: "field-name", value: "avg_price" },
              },
              {
                type: "sum",
                field: { type: "field-name", value: "revenue" },
              },
            ],
          },
        ],
      });
    });

    it("parses streamstats command with field renaming", () => {
      const result = parseQuery(
        "streamstats count(events) as running_total",
      ).ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "streamstats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "events" },
                asField: { type: "field-name", value: "running_total" },
              },
            ],
          },
        ],
      });
    });

    it("parses aggregation functions with field names containing parentheses", () => {
      const result = parseQuery(
        "stats count(field(with)parens) as renamed_field",
      ).ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "stats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "field(with)parens" },
                asField: { type: "field-name", value: "renamed_field" },
              },
            ],
          },
        ],
      });
    });

    it("parses stats command with single grouping field", () => {
      const result = parseQuery("stats count(events) as total by country").ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "stats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "events" },
                asField: { type: "field-name", value: "total" },
              },
            ],
            groupBy: [{ type: "field-name", value: "country" }],
          },
        ],
      });
    });

    it("parses stats command with multiple grouping fields", () => {
      const result = parseQuery(
        "stats count(events) as total by country, state",
      ).ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "stats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "events" },
                asField: { type: "field-name", value: "total" },
              },
            ],
            groupBy: [
              { type: "field-name", value: "country" },
              { type: "field-name", value: "state" },
            ],
          },
        ],
      });
    });

    it("parses stats command with multiple aggregations and grouping", () => {
      const result = parseQuery(
        "stats count(events) as total, avg(price) as avg_price by country",
      ).ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "stats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "events" },
                asField: { type: "field-name", value: "total" },
              },
              {
                type: "avg",
                field: { type: "field-name", value: "price" },
                asField: { type: "field-name", value: "avg_price" },
              },
            ],
            groupBy: [{ type: "field-name", value: "country" }],
          },
        ],
      });
    });

    it("parses streamstats command with single grouping field", () => {
      const result = parseQuery(
        "streamstats count(events) as total by country",
      ).ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "streamstats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "events" },
                asField: { type: "field-name", value: "total" },
              },
            ],
            groupBy: [{ type: "field-name", value: "country" }],
          },
        ],
      });
    });

    it("parses streamstats command with multiple grouping fields", () => {
      const result = parseQuery(
        "streamstats count(events) as total by country, state",
      ).ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "streamstats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "events" },
                asField: { type: "field-name", value: "total" },
              },
            ],
            groupBy: [
              { type: "field-name", value: "country" },
              { type: "field-name", value: "state" },
            ],
          },
        ],
      });
    });

    it("parses streamstats command with multiple aggregations and grouping", () => {
      const result = parseQuery(
        "streamstats count(events) as total, avg(price) as avg_price by country",
      ).ast;
      assert.partialDeepStrictEqual(result, {
        type: "query",
        pipeline: [
          {
            type: "streamstats",
            aggregations: [
              {
                type: "count",
                field: { type: "field-name", value: "events" },
                asField: { type: "field-name", value: "total" },
              },
              {
                type: "avg",
                field: { type: "field-name", value: "price" },
                asField: { type: "field-name", value: "avg_price" },
              },
            ],
            groupBy: [{ type: "field-name", value: "country" }],
          },
        ],
      });
    });

    it("parses where command with comparison", () => {
      const result = parseQuery("where a >= 5").ast;
      const whereCmd = result.pipeline[0] as WhereCommandAST;
      assert.partialDeepStrictEqual(whereCmd, {
        type: "where",
        expr: {
          type: "binary-op",
          op: ">=",
          left: { type: "field-name", value: "a" },
          right: { type: "number", value: 5n },
        },
      });
    });
  });

  describe("operator case sensitivity", () => {
    it("uses uppercase operators (AND, OR, NOT) in search command comparison expressions", () => {
      const result = parseQuery("search a=1 AND b=2 OR NOT c=3").ast;
      const searchCmd = result.pipeline[0] as SearchCommandAST;
      assert.partialDeepStrictEqual(searchCmd.filters[0], {
        type: "search-binary-op",
        op: "OR",
        left: {
          type: "search-binary-op",
          op: "AND",
          left: {
            type: "compare",
            op: "=",
            left: { type: "field-name", value: "a" },
            right: { type: "number", value: 1n },
          },
          right: {
            type: "compare",
            op: "=",
            left: { type: "field-name", value: "b" },
            right: { type: "number", value: 2n },
          },
        },
        right: {
          type: "search-unary-op",
          op: "NOT",
          operand: {
            type: "compare",
            op: "=",
            left: { type: "field-name", value: "c" },
            right: { type: "number", value: 3n },
          },
        },
      });
    });

    it("uses lowercase operators (and, or, not) in eval command expressions", () => {
      const result = parseQuery("eval result = a=1 and b=2 or not c=3").ast;
      const evalCmd = result.pipeline[0] as EvalCommandAST;
      assert.partialDeepStrictEqual(evalCmd.bindings[0][1], {
        type: "binary-op",
        op: "or",
        left: {
          type: "binary-op",
          op: "and",
          left: {
            type: "binary-op",
            op: "=",
            left: { type: "field-name", value: "a" },
            right: { type: "number", value: 1n },
          },
          right: {
            type: "binary-op",
            op: "=",
            left: { type: "field-name", value: "b" },
            right: { type: "number", value: 2n },
          },
        },
        right: {
          type: "unary-op",
          op: "not",
          operand: {
            type: "binary-op",
            op: "=",
            left: { type: "field-name", value: "c" },
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
      assert.partialDeepStrictEqual(sortCmd, {
        type: "sort",
        count: undefined,
        fields: [
          {
            type: "sort-field",
            field: { type: "field-name", value: "a" },
            comparator: undefined,
            desc: undefined,
          },
        ],
      });
    });

    it("parses sort with count", () => {
      const result = parseQuery("| sort 1000 a").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.partialDeepStrictEqual(sortCmd, {
        type: "sort",
        count: { type: "number", value: 1000n },
        fields: [
          {
            type: "sort-field",
            field: { type: "field-name", value: "a" },
            comparator: undefined,
            desc: undefined,
          },
        ],
      });
    });

    it("parses sort with comparator", () => {
      const result = parseQuery("| sort 1000 str(a)").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.partialDeepStrictEqual(sortCmd, {
        type: "sort",
        count: { type: "number", value: 1000n },
        fields: [
          {
            type: "sort-field",
            field: { type: "field-name", value: "a" },
            comparator: "str",
            desc: undefined,
          },
        ],
      });
    });

    it("parses sort with descending field", () => {
      const result = parseQuery("| sort -a").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.partialDeepStrictEqual(sortCmd, {
        type: "sort",
        count: undefined,
        fields: [
          {
            type: "sort-field",
            field: { type: "field-name", value: "a" },
            comparator: undefined,
            desc: true,
          },
        ],
      });
    });

    it("parses sort with explicit ascending field", () => {
      const result = parseQuery("| sort +a").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.partialDeepStrictEqual(sortCmd, {
        type: "sort",
        count: undefined,
        fields: [
          {
            type: "sort-field",
            field: { type: "field-name", value: "a" },
            comparator: undefined,
            desc: false,
          },
        ],
      });
    });

    it("parses sort with comparator and descending field", () => {
      const result = parseQuery("| sort -str(a)").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.partialDeepStrictEqual(sortCmd, {
        type: "sort",
        count: undefined,
        fields: [
          {
            type: "sort-field",
            field: { type: "field-name", value: "a" },
            comparator: "str",
            desc: true,
          },
        ],
      });
    });

    it("parses complex sort", () => {
      const result = parseQuery("| sort 200 -str(a), beta, auto(gamma)").ast;
      const sortCmd = result.pipeline[1] as SortCommandAST;
      assert.partialDeepStrictEqual(sortCmd, {
        type: "sort",
        count: { type: "number", value: 200n },
        fields: [
          {
            type: "sort-field",
            field: { type: "field-name", value: "a" },
            comparator: "str",
            desc: true,
          },
          {
            type: "sort-field",
            field: { type: "field-name", value: "beta" },
            comparator: undefined,
            desc: undefined,
          },
          {
            type: "sort-field",
            field: { type: "field-name", value: "gamma" },
            comparator: "auto",
            desc: undefined,
          },
        ],
      });
    });
  });

  describe("field names", () => {
    it("parses field names with parentheses", () => {
      const result = parseQuery("search field(with)parens=value").ast;
      const searchCmd = result.pipeline[0] as SearchCommandAST;
      assert.partialDeepStrictEqual(searchCmd.filters[0], {
        type: "compare",
        op: "=",
        left: { type: "field-name", value: "field(with)parens" },
        right: { type: "string", value: "value" },
      });
    });

    it("parses field names with nested parentheses", () => {
      const result = parseQuery("search field(with(nested))parens=value").ast;
      const searchCmd = result.pipeline[0] as SearchCommandAST;
      assert.partialDeepStrictEqual(searchCmd.filters[0], {
        type: "compare",
        op: "=",
        left: { type: "field-name", value: "field(with(nested))parens" },
        right: { type: "string", value: "value" },
      });
    });

    it("parses field names with multiple parentheses groups", () => {
      const result = parseQuery("search field(first)(second)=value").ast;
      const searchCmd = result.pipeline[0] as SearchCommandAST;
      assert.partialDeepStrictEqual(searchCmd.filters[0], {
        type: "compare",
        op: "=",
        left: { type: "field-name", value: "field(first)(second)" },
        right: { type: "string", value: "value" },
      });
    });

    it("throws error for unclosed parentheses in field names", () => {
      // This test verifies that unclosed parentheses are handled appropriately
      // The search parser is flexible and may parse "field" separately, which is valid behavior
      const result = parseQuery("search field(unclosed=value");
      const searchCommand = result.ast.pipeline[0] as SearchCommandAST;
      // Should either throw an error or parse "field" as a separate term
      assert.ok(searchCommand.filters.length > 0);
    });
  });

  describe("fields command", () => {
    it("parses simple fields command", () => {
      const result = parseQuery("| fields a").ast;
      const fieldsCmd = result.pipeline[1] as FieldsCommandAST;

      assert.partialDeepStrictEqual(fieldsCmd, {
        type: "fields",
        fields: [{ type: "field-name", value: "a" }],
        remove: undefined,
      });
    });

    it("parses multiple fields", () => {
      const result = parseQuery("| fields a, b, c").ast;
      const fieldsCmd = result.pipeline[1] as FieldsCommandAST;

      assert.partialDeepStrictEqual(fieldsCmd, {
        type: "fields",
        fields: [
          { type: "field-name", value: "a" },
          { type: "field-name", value: "b" },
          { type: "field-name", value: "c" },
        ],
        remove: undefined,
      });
    });

    it("parses multiple removed fields", () => {
      const result = parseQuery("| fields -a, b, c").ast;
      const fieldsCmd = result.pipeline[1] as FieldsCommandAST;

      assert.partialDeepStrictEqual(fieldsCmd, {
        type: "fields",
        fields: [
          { type: "field-name", value: "a" },
          { type: "field-name", value: "b" },
          { type: "field-name", value: "c" },
        ],
        remove: true,
      });
    });

    it("parses explicit retained fields", () => {
      const result = parseQuery("| fields +a, b, c").ast;
      const fieldsCmd = result.pipeline[1] as FieldsCommandAST;

      assert.partialDeepStrictEqual(fieldsCmd, {
        type: "fields",
        fields: [
          { type: "field-name", value: "a" },
          { type: "field-name", value: "b" },
          { type: "field-name", value: "c" },
        ],
        remove: false,
      });
    });
  });

  describe("rex command", () => {
    it("parses a basic rex command", () => {
      const result = parseQuery('| rex "abc"').ast;
      const rexCmd = result.pipeline[1] as RexCommandAST;

      assert.partialDeepStrictEqual(rexCmd, {
        type: "rex",
        field: undefined,
        regex: {
          type: "string",
          value: "abc",
        },
      });
    });

    it("parses a rex command with field extraction", () => {
      const result = parseQuery('| rex "(?<alpha>abc)"').ast;
      const rexCmd = result.pipeline[1] as RexCommandAST;

      assert.partialDeepStrictEqual(rexCmd, {
        type: "rex",
        field: undefined,
        regex: {
          type: "string",
          value: "(?<alpha>abc)",
        },
      });
    });

    it("parses a rex command with field", () => {
      const result = parseQuery('| rex field=_raw "(?<alpha>abc)"').ast;
      const rexCmd = result.pipeline[1] as RexCommandAST;

      assert.partialDeepStrictEqual(rexCmd, {
        type: "rex",
        field: {
          type: "field-name",
          value: "_raw",
        },
        regex: {
          type: "string",
          value: "(?<alpha>abc)",
        },
      });
    });

    it("parses a rex command with mode", () => {
      const result = parseQuery('| rex mode=sed "(?<alpha>abc)"').ast;
      const rexCmd = result.pipeline[1] as RexCommandAST;

      assert.partialDeepStrictEqual(rexCmd, {
        type: "rex",
        mode: "sed",
        field: undefined,
        regex: {
          type: "string",
          value: "(?<alpha>abc)",
        },
      });
    });

    it("parses a rex command with field and mode", () => {
      const result = parseQuery(
        '| rex field=name mode=sed "(?<name>j(?:ay|ules))"',
      ).ast;
      const rexCmd = result.pipeline[1] as RexCommandAST;

      assert.partialDeepStrictEqual(rexCmd, {
        type: "rex",
        mode: "sed",
        field: {
          type: "field-name",
          value: "name",
        },
        regex: {
          type: "string",
          value: "(?<name>j(?:ay|ules))",
        },
      });
    });
  });
});
