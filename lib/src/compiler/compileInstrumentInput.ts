export function compileInstrumentInput(): string {
  return `
    function* instrumentInput(records, context) {
      for (const record of records) {
        context.recordsRead += 1; 
        yield record;
      }
    }
  `;
}
