export const AsyncGeneratorFunction = Object.getPrototypeOf(
  async function* () {},
).constructor as {
  new (...args: string[]): AsyncGeneratorFunction;
};
