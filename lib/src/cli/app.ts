import { buildApplication, buildRouteMap } from "@stricli/core";
import { commandCompile } from "./commands/compile";
import { commandExec } from "./commands/exec";

export const root = buildRouteMap({
  routes: {
    exec: commandExec,
    compile: commandCompile,
  },
  defaultCommand: "exec",
  docs: {
    brief: "caveql CLI",
  },
});

export const app = buildApplication(root, { name: "caveql" });
