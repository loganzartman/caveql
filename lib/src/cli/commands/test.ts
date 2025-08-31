import { buildCommand } from "@stricli/core";
import { compileQuery } from "../../compiler";
import { parseQuery } from "../../parser";
import streamJSON from "stream-json";
import StreamArray from "stream-json/streamers/StreamArray.js";
import { Readable } from "node:stream";

// Create async iterable from JSON string using stream-json
async function* createStreamingTestData(): AsyncIterable<unknown> {
  // Hardcoded JSON array as string
  const jsonString = JSON.stringify([
    { name: "Alice", age: 30, city: "New York" },
    { name: "Bob", age: 25, city: "Los Angeles" },
    { name: "Charlie", age: 35, city: "New York" },
    { name: "Diana", age: 28, city: "Chicago" },
    { name: "Eve", age: 22, city: "Boston" }
  ]);
  
  console.log("Creating stream-json pipeline from JSON string");
  
  // Create a Node.js readable stream from the JSON string
  // Create a non-object-mode Readable and push a string chunk
  const input = new Readable({ read() {/* no-op */} });
  input.push(jsonString, 'utf8');
  input.push(null);

  // Build the pipeline using native .pipe chaining
  const jsonParser = (streamJSON as unknown as { parser: () => NodeJS.ReadWriteStream }).parser();
  const streamArray = (StreamArray as unknown as { streamArray: () => NodeJS.ReadWriteStream }).streamArray();

  // Debug modes
  // Diagnostics (best-effort; may be undefined)
  console.log('input.readableObjectMode:', (input as unknown as { _readableState?: { objectMode?: boolean } })._readableState?.objectMode);
  console.log('parser.writableObjectMode:', (jsonParser as unknown as { _writableState?: { objectMode?: boolean } })._writableState?.objectMode);
  console.log('parser.readableObjectMode:', (jsonParser as unknown as { _readableState?: { objectMode?: boolean } })._readableState?.objectMode);

  input.on('data', (d: unknown) => {
    const ctor = (d as { constructor?: { name?: string } } | undefined)?.constructor?.name;
    const isBuf = typeof Buffer !== 'undefined' && typeof (Buffer as unknown as { isBuffer: (x: unknown) => boolean }).isBuffer === 'function' ? (Buffer as unknown as { isBuffer: (x: unknown) => boolean }).isBuffer(d) : false;
    console.log('input data type:', typeof d, 'isBuffer:', isBuf, 'ctor:', ctor);
  });
  // @ts-ignore
  jsonParser.on('pipe', (src) => {
    console.log('jsonParser got piped from', src.constructor?.name);
  });
  // @ts-ignore
  jsonParser.on('data', (tok) => {
    console.log('jsonParser out type:', typeof tok, 'keys:', tok && Object.keys(tok));
  });
  const pipeline = input.pipe(jsonParser).pipe(streamArray);

  console.log("Created stream-json pipeline (Readable -> parser -> StreamArray), starting iteration...");

  let count = 0;
  try {
    for await (const chunk of pipeline as AsyncIterable<{key: number; value: unknown}>) {
      console.log(`Stream chunk ${count++}:`, JSON.stringify(chunk));
      yield chunk.value;
    }
    console.log("Finished stream-json parsing");
  } catch (error) {
    console.error("Error in stream-json pipeline:", error);
    throw error;
  } finally {
    // Ensure cleanup to avoid pending handles
    try {
      // @ts-ignore optional destroy
      pipeline.destroy?.();
    } catch {}
    try {
      input.destroy();
    } catch {}
  }
}

// Hardcoded async generator for testing (original version)
async function* createTestData(): AsyncIterable<unknown> {
  const testData = [
    { name: "Alice", age: 30, city: "New York" },
    { name: "Bob", age: 25, city: "Los Angeles" },
    { name: "Charlie", age: 35, city: "New York" },
    { name: "Diana", age: 28, city: "Chicago" },
    { name: "Eve", age: 22, city: "Boston" }
  ];
  
  console.log("Test data generator: Starting to yield records");
  for (const record of testData) {
    console.log("Test data generator: Yielding", JSON.stringify(record));
    yield record;
  }
  console.log("Test data generator: Finished yielding all records");
}

export const testCommand = buildCommand({
  func: async (flags: { streaming?: boolean }) => {
    console.log("Starting test command...");
    
    // Test with a simple search query
    const queryString = "search age > 25";
    console.log(`Testing query: ${queryString}`);
    
    // Parse the query
    const parsed = parseQuery(queryString);
    console.log("Parsed query successfully");
    
    // Compile the query
    const run = compileQuery(parsed.ast);
    console.log("Compiled query successfully");
    
    // Create test data - choose between streaming and hardcoded
    const testInput = flags.streaming ? createStreamingTestData() : createTestData();
    console.log(`Created ${flags.streaming ? 'streaming' : 'hardcoded'} test input async generator`);
    
    // Run the compiled query
    console.log("Starting query execution...");
    let count = 0;
    try {
      for await (const record of run(testInput)) {
        console.log(`Result ${count + 1}:`, JSON.stringify(record));
        count++;
        if (count >= 10) break; // Limit output
      }
    } catch (error) {
      console.error("Error during query execution:", error);
      throw error;
    }
    
    console.log(`Test completed successfully! Processed ${count} records.`);
  },
  
  parameters: {
    flags: {
      streaming: {
        brief: "Use streaming JSON parser instead of hardcoded data",
        kind: "boolean",
        optional: true,
      },
    },
  },
  
  docs: {
    brief: "Test async generators with hardcoded or streaming data",
  },
});