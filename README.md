# caveql

parses and executes a tiny subset of splunk SPL on in-memory data.

usable via browser UI, CLI, and library import.

this is a toy project for fun

[sample query](https://caveql.loga.nz/#a𥒅菍疃㤔𠏠𤒓𤿃𨁬𠬃𒈁𡜡嗺段𡽗𓈖𤹠𠻼𧳑䇝𡍢𤯚𥕬𧴽滋𢞢𢜗𒊅俒𡯬𤹮𥔖𣭆𤼨晒臛㐧𤟰𡲜㬬𣊫臭𤴞剒ꄨ食𠠖耙他墖燥怄宝𣅛𦮖䗠𥡏𦹓𢐱𨓈条銞𥴰𡶉𡩹𦛪𡦝鍦𥂇𐚦𣒣𤋪枣𢻿𧈯𓈟㵵𢋝鱆𢄻𡑎𣔐𒈤𧉮𠤚輂𣲹𢖜愳𒆑䯎𖥃㽟余𔒬𨂚𦷰𣹫𧝨錶𢴋𥸥命𒋤𖦰𣶈𨋁𣳮連𢦭𠣥𥌍䚾镚𠺜𠝵𧦌次𦅊槯𧃄𢛗ᕏ)

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
