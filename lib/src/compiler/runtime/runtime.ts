import TinyQueue from "tinyqueue";
import {
  compareFieldAuto,
  compareFieldNumber,
  compareFieldString,
} from "../command/compileSortCommand";
import { joinAsyncGenerators, splitAsyncGenerator } from "./generators";
import { StreamingMode } from "./StreamingMode";
import { StreamingPerc } from "./StreamingPerc";
import { StreamingVar } from "./StreamingVar";
import { mapRecordsNode } from "./threading/mapRecordsNode";
import { mapRecordsWeb } from "./threading/mapRecordsWeb";

// runtime dependencies required by the compiled function, which should be
// injected as a parameter rather than compiled into the function itself.
export type InjectedDeps = ReturnType<typeof getRuntimeDeps>;
export function getRuntimeDeps() {
  return {
    compareFieldAuto,
    compareFieldNumber,
    compareFieldString,
    looseEq,
    randomInt,
    TinyQueue,
    StreamingMode,
    StreamingPerc,
    StreamingVar,
    mod,
    add,
    sub,
    mul,
    div,
    concat,
    min,
    max,
    isnull,
    splitAsyncGenerator,
    joinAsyncGenerators,
    mapRecords: typeof Worker === "undefined" ? mapRecordsNode : mapRecordsWeb,
  } as const;
}

function looseEq(a: unknown, b: unknown): boolean {
  if (typeof a === "string") a = a.toLowerCase();
  if (typeof b === "string") b = b.toLowerCase();
  // biome-ignore lint/suspicious/noDoubleEquals: coerce it!
  return a == b;
}

function randomInt(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

function mod(a: unknown, b: unknown): number | bigint {
  if (typeof a !== "number" && typeof a !== "bigint") {
    throw new Error(`Expected number, got ${typeof a}`);
  }
  if (typeof b !== "number" && typeof b !== "bigint") {
    throw new Error(`Expected number, got ${typeof b}`);
  }

  if (typeof a === "number" || typeof b === "number") {
    return Number(a) % Number(b);
  }
  return a % b;
}

function add(a: unknown, b: unknown): number | bigint | string {
  if (typeof a !== "number" && typeof a !== "bigint" && typeof a !== "string") {
    throw new Error(`Expected number or string, got ${typeof a}`);
  }
  if (typeof b !== "number" && typeof b !== "bigint" && typeof b !== "string") {
    throw new Error(`Expected number or string, got ${typeof b}`);
  }

  if (typeof a === "string" || typeof b === "string") {
    return String(a) + String(b);
  }
  if (typeof a === "number" || typeof b === "number") {
    return Number(a) + Number(b);
  }
  return a + b;
}

function sub(a: unknown, b: unknown): number | bigint {
  if (typeof a !== "number" && typeof a !== "bigint") {
    throw new Error(`Expected number, got ${typeof a}`);
  }
  if (typeof b !== "number" && typeof b !== "bigint") {
    throw new Error(`Expected number, got ${typeof b}`);
  }

  if (typeof a === "number" || typeof b === "number") {
    return Number(a) - Number(b);
  }
  return a - b;
}

function mul(a: unknown, b: unknown): number | bigint {
  if (typeof a !== "number" && typeof a !== "bigint") {
    throw new Error(`Expected number, got ${typeof a}`);
  }
  if (typeof b !== "number" && typeof b !== "bigint") {
    throw new Error(`Expected number, got ${typeof b}`);
  }

  if (typeof a === "number" || typeof b === "number") {
    return Number(a) * Number(b);
  }
  return a * b;
}

function div(a: unknown, b: unknown): number | bigint {
  if (typeof a !== "number" && typeof a !== "bigint") {
    throw new Error(`Expected number, got ${typeof a}`);
  }
  if (typeof b !== "number" && typeof b !== "bigint") {
    throw new Error(`Expected number, got ${typeof b}`);
  }

  if (typeof a === "number" || typeof b === "number") {
    return Number(a) / Number(b);
  }
  return a / b;
}

function concat(a: unknown, b: unknown): string {
  if (typeof a !== "string" && typeof a !== "number" && typeof a !== "bigint") {
    throw new Error(`Expected string, number, or bigint, got ${typeof a}`);
  }
  if (typeof b !== "string" && typeof b !== "number" && typeof b !== "bigint") {
    throw new Error(`Expected string, number, or bigint, got ${typeof b}`);
  }

  return String(a) + String(b);
}

function min(a: unknown, b: unknown): unknown {
  if (isnull(a) && isnull(b)) {
    return null;
  }
  if (isnull(a)) {
    return b;
  }
  if (isnull(b)) {
    return a;
  }

  if (typeof a !== "number" && typeof a !== "bigint" && typeof a !== "string") {
    throw new Error(`Expected number, bigint, or string, got ${typeof a}`);
  }
  if (typeof b !== "number" && typeof b !== "bigint" && typeof b !== "string") {
    throw new Error(`Expected number, bigint, or string, got ${typeof b}`);
  }

  return a < b ? a : b;
}

function max(a: unknown, b: unknown): unknown {
  if (isnull(a) && isnull(b)) {
    return null;
  }
  if (isnull(a)) {
    return b;
  }
  if (isnull(b)) {
    return a;
  }

  if (typeof a !== "number" && typeof a !== "bigint" && typeof a !== "string") {
    throw new Error(`Expected number, bigint, or string, got ${typeof a}`);
  }
  if (typeof b !== "number" && typeof b !== "bigint" && typeof b !== "string") {
    throw new Error(`Expected number, bigint, or string, got ${typeof b}`);
  }

  return a > b ? a : b;
}

function isnull(a: unknown): boolean {
  return a === null || a === undefined;
}
