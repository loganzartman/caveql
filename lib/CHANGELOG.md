# caveql

## 0.3.0

### Minor Changes

- c427ddc: Support streaming input!

  ## CLI

  - Input files are streamed rather than loaded into memory. Supports big big files!
  - Adds support for JSONL/NDJSON and CSV, in addition to JSON
  - Allows specifying input format using URL query syntax
  - Query is now optional

  ## lib

  - (breaking) calling a compiled `QueryFunction` now yields an async generator rather than a sync generator
  - expose `readRecords` for streaming records from file inputs (see CLI source for example)

## 0.2.0

### Minor Changes

- e1a8640: Adds CLI and bin for caveql package
