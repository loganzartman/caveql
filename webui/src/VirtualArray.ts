export class VirtualArray<T extends object> {
  private _items: T[];
  private _fieldSet: Set<string>;

  constructor(items?: Array<T>, fieldSet?: Set<string>) {
    this._items = items ?? [];
    this._fieldSet =
      fieldSet ?? new Set(this._items.flatMap((item) => Object.keys(item)));
  }

  get length() {
    return this._items.length;
  }

  get fieldSet(): Readonly<Set<string>> {
    return this._fieldSet;
  }

  push(...items: T[]): VirtualArray<T> {
    return this.concat(items);
  }

  concat(items: T[]): VirtualArray<T> {
    for (const item of items) {
      this._items.push(item);
      for (const key of Object.keys(item)) {
        this._fieldSet.add(key);
      }
    }
    return new VirtualArray(this._items, this._fieldSet);
  }

  clear(): VirtualArray<T> {
    this._items.length = 0;
    this._fieldSet.clear();
    return new VirtualArray(this._items, this._fieldSet);
  }

  at(index: number): T | undefined {
    return this._items.at(index);
  }

  head(n: number): T[] {
    return this._items.slice(0, n);
  }
}
