import os from "node:os";

export type CompileContext = {
  concurrency: number;
  environment: "node" | "web";
  threads: AsyncGenerator<Record<string, unknown>>[];
};

export function createCompileContext({
  concurrency = detectConcurrency(),
  environment = detectEnvironment(),
}: {
  concurrency?: number;
  environment?: "node" | "web";
} = {}): CompileContext {
  return { concurrency, environment, threads: [] };
}

function detectConcurrency(): number {
  return navigator ? navigator.hardwareConcurrency : os.cpus().length;
}

function detectEnvironment(): "node" | "web" {
  if (typeof Worker !== "undefined") {
    return "web";
  }
  return "node";
}
