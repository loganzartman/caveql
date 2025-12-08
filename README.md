# caveql

parses and executes a tiny subset of splunk SPL on in-memory data.

usable via browser UI, CLI, and library import.

this is a toy project for fun

[sample query](https://caveql.loga.nz/?q=bࡄݱհyIVߦନకʌجཇћߜ౪ХဌrԵଊतѭࠅʖࡣखஇɰοວɇঝҕఐഅӘǂചɈѮɱڗذच۵ਧഹɣդएബԹƭٴݐ౺øؾѸঋຜચݣƝඵɟਏШఈƙנޣѾʤวԭவಱআPՇमဋڋຝߐࠒձؼࡋ෯Іঘݩߪନڤཉ༯Ԯ๖൫પ१Ыဥƒ൱སѰδଳӻѪรৎළטधϺນഴణ୫পԻޤڞतࡉࡄࡍॵࡃڕտݲ൮௬ഈ௧з౬ವƐѥݮဌ၂ѢయМஎƶѻ۰т൦कଗƣۿࠐ୦ƁӉ൜Р༳ƀयஎཀڅભཇՈ)

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
