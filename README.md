# caveql

parses and executes a tiny subset of splunk SPL on in-memory data.

usable via browser UI, CLI, and library import.

this is a toy project for fun

[sample query](https://caveql.loga.nz/#fCBtYWtlcmVzdWx0cyBmb3JtYXQ9anNvbiBkYXRhPSdbCiAgICB7InVybCI6ICJodHRwczovL2xvZ2EubnovIiwgInN0YXR1cyI6IDIwMCwgImR1cmF0aW9uIjogMC4wMTJ9LAogICAgeyJ1cmwiOiAiaHR0cHM6Ly9sb2dhLm56L2NhdCIsICJzdGF0dXMiOiA0MDQsICJkdXJhdGlvbiI6IDAuMDUxfSwKICAgIHsidXJsIjogImh0dHBzOi8vbG9nYS5uei9ibG9nIiwgInN0YXR1cyI6IDIwMCwgImR1cmF0aW9uIjogMC4wMjR9LAogICAgeyJ1cmwiOiAiaHR0cHM6Ly9sb2dhLm56L2FkbWluLnBocCIsICJzdGF0dXMiOiA0MDQsICJkdXJhdGlvbiI6IDAuMDQxfSwKICAgIHsidXJsIjogImh0dHBzOi8vbG9nYS5uei9hZG1pbiIsICJzdGF0dXMiOiA0MDMsICJkdXJhdGlvbiI6IDAuMDQ5fQogICAgXScKfCBldmFsIGR1cmF0aW9uX21zID0gcm91bmQoZHVyYXRpb24gKiAxMDAwKQp8IGZpZWxkcyAtX3JhdywgZHVyYXRpb24KfCByZXggZmllbGQ9dXJsICJcdys6LytbXi9dKyg/PHBhdGg+LiopIgp8IHdoZXJlIHN0YXR1cyA+PSA0MDAKfCBzb3J0IHN0YXR1cywgLWR1cmF0aW9uX21z)

## usage

### web

[try it!](https://caveql.loga.nz/)

### CLI

```bash
npx caveql --help
```

run a query on a file:

```bash
npx caveql -i ./sample/population.json "usa | stats max(value)"
```

run a query not on a file:

```bash
npx caveql "| makeresults count=10 | streamstats count as x | eval y=x*x"
```

### library

```bash
pnpm add caveql
```

```ts
import { parseQuery, compileQuery } from "caveql";

const parsed = parseQuery("usa | stats max(value)");
const run = compileQuery(parsed.ast);

const result = run([
  { country: "usa", value: 100 },
  { country: "can", value: 200 },
]);

for (const record of result) {
  console.log(record);
}
```

## development

setup:

1. install nvm
1. switch node version: `nvm install`
1. enable corepack: `corepack enable`
1. install dependencies: `pnpm i`

build: `pnpm build`

dev server: `pnpm dev`
