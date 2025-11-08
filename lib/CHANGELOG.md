# caveql

## 0.5.0

### Minor Changes

- 3ad3efc: Add stats functions perc, exactperc, median, mode, range, var, stdev
- 1311389: Implement head command

## 0.4.0

### Minor Changes

- 0643ce0: Support 'by' clause for grouping in stats and streamstats

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
