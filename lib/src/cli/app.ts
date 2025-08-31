import { buildApplication, buildRouteMap } from "@stricli/core";
import { execCommand } from "./commands/exec";
import { testCommand } from "./commands/test";

export const root = buildRouteMap({
  routes: {
    exec: execCommand,
    test: testCommand,
  },
  defaultCommand: "exec",
  docs: {
    brief: "caveql CLI",
  },
});

export const app = buildApplication(root, { name: "caveql" });
