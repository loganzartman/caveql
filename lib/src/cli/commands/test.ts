import { buildCommand } from "@stricli/core";
import { mapRecordsNode } from "../../compiler/runtime/threading/mapRecordsNode";

export const testCommand = buildCommand({
  func: async () => {
    const result = await mapRecordsNode({
      records: [
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ],
      fnBody: "for (const record of records) { yield record; }",
    });
    for await (const record of result) {
      console.log("record", record);
    }
  },
  parameters: {},
  docs: {
    fullDescription: "demo",
    brief: "demo",
  },
});
