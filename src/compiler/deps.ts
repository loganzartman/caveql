import TinyQueue from "tinyqueue";
import {
  compareFieldAuto,
  compareFieldNumber,
  compareFieldString,
} from "./command/compileSortCommand";

// runtime dependencies required by the compiled function, which should be
// injected as a parameter rather than compiled into the function itself.
export type InjectedDeps = {
  compareFieldAuto: typeof compareFieldAuto;
  compareFieldNumber: typeof compareFieldNumber;
  compareFieldString: typeof compareFieldString;
  looseEq: typeof looseEq;
  TinyQueue: typeof TinyQueue;
};

export function createDeps(): InjectedDeps {
  return {
    compareFieldAuto,
    compareFieldNumber,
    compareFieldString,
    looseEq,
    TinyQueue,
  };
}

function looseEq(a: unknown, b: unknown): boolean {
  if (typeof a === "string") a = a.toLowerCase();
  if (typeof b === "string") b = b.toLowerCase();
  // biome-ignore lint/suspicious/noDoubleEquals: coerce it!
  return a == b;
}
