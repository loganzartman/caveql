import { buildApplication, buildRouteMap } from "@stricli/core";
import { execCommand } from "./commands/exec";

export const root = buildRouteMap({
  routes: {
    exec: execCommand,
  },
  defaultCommand: "exec",
  docs: {
    brief: "caveql CLI",
  },
});

export const app = buildApplication(root, { name: "caveql" });
