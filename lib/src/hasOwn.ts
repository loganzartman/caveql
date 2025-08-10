export function hasOwn<T extends object, K extends PropertyKey>(
  obj: T,
  prop: K,
): obj is T & Record<K, T[keyof T]> {
  return Object.hasOwn(obj, prop);
}
