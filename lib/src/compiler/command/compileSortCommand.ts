import { impossible } from "../../impossible";
import type {
  SortCommandAST,
  SortFieldAST,
} from "../../parser/command/parseSortCommand";
import { compilePathGet } from "../utils";

export function compileSortCommand(command: SortCommandAST): string {
  const { count, fields } = command;
  const countValue = count === undefined ? 10000 : count.value;

  // uses a heap-sort to return the first `count` sorted items with O(N log M) complexity, where
  // - N is the number of records, and
  // - M is the count of results to return.
  // this should be fast compared to O(N log N) for sorting all items if N is big.
  // it's likely slower than native sort for small N or big M.
  return `
    function* sortCommand(records) {
      const q = new TinyQueue([], (${compileSortComparator(fields)})); 
      
      for (const record of records) {
        q.push(record);
        if (q.length > ${countValue}) {
          q.pop();
        }
      }

      const results = [];
      while (q.length) {
        results.push(q.pop());
      }
      for (let i = results.length - 1; i >= 0; --i) {
        yield results[i];
      }
    }
  `;
}

export function compileSortComparator(fields: SortFieldAST[]): string {
  const comparators = fields.map((field) => {
    // make this a max-heap so we get the head rather than the tail of the results
    const reversedSign = field.desc ? "" : "-";
    switch (field.comparator) {
      case undefined:
      case "auto":
        return `${reversedSign}compareFieldAuto(${compilePathGet("a", field.field.value)}, ${compilePathGet("b", field.field.value)})`;
      case "ip":
        throw new Error("IP sort comparison not implemented");
      case "num":
        return `${reversedSign}compareFieldNumber(${compilePathGet("a", field.field.value)}, ${compilePathGet("b", field.field.value)})`;
      case "str":
        return `${reversedSign}compareFieldString(${compilePathGet("a", field.field.value)}, ${compilePathGet("b", field.field.value)})`;
      default:
        impossible(field.comparator);
    }
  });

  return `(a, b) => (${comparators.join(" || ")})`;
}

export function compareFieldAuto(a: unknown, b: unknown): number {
  if (numberLike(a) && numberLike(b)) {
    return compareFieldNumber(a, b);
  }
  // TODO: detect IPs
  return compareFieldString(a, b);
}

export function compareFieldNumber(a: unknown, b: unknown): number {
  if (typeof a === "bigint" && typeof b === "bigint") {
    return Number(a - b);
  }
  return coerceNumber(a) - coerceNumber(b);
}

export function compareFieldString(a: unknown, b: unknown): number {
  return coerceString(a).localeCompare(coerceString(b));
}

function numberLike(x: unknown): boolean {
  if (typeof x === "number" || typeof x === "bigint") {
    return true;
  }
  if (typeof x === "string" && /\d/.test(x[0])) {
    return true;
  }
  return false;
}

function coerceNumber(x: unknown): number {
  if (typeof x === "number") {
    return x;
  }
  if (typeof x === "string") {
    return Number.parseFloat(x);
  }
  if (typeof x === "bigint") {
    return Number(x);
  }
  return NaN;
}

function coerceString(x: unknown): string {
  const t = typeof x;
  if (t === "string" || t === "number" || t === "bigint" || t === "boolean") {
    return String(x);
  }
  if (x === null || x === undefined) {
    return "";
  }
  if (t === "object") {
    return JSON.stringify(x);
  }
  throw new Error(`Can't coerce ${t} to string.`);
}
