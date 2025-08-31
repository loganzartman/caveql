import { buildCommand } from "@stricli/core";
import { compileQuery } from "../../compiler";
import { parseQuery } from "../../parser";

// Hardcoded async generator for testing
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
  func: async () => {
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
    
    // Create test data
    const testInput = createTestData();
    console.log("Created test input async generator");
    
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
    flags: {},
  },
  
  docs: {
    brief: "Test async generators with hardcoded data",
  },
});