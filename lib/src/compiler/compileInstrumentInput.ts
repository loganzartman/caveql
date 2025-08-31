export function compileInstrumentInput(): string {
  return `
    async function* instrumentInput(records, context) {
      for await (const record of records) {
        context.recordsRead += 1;
        yield record;
      }
    }
  `;
}
