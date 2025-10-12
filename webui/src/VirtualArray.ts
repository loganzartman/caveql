export class VirtualArray<T extends object> {
  private _items: T[];
  private _itemsView: ReadonlyArray<T>;
  private _fieldSet: Set<string>;

  private constructor(items: Array<T>, fieldSet: Set<string>) {
    this._items = items;
    this._fieldSet = new Set(fieldSet);
    this._itemsView = new Proxy(this._items, {});
  }

  static create<T extends object>(): VirtualArray<T> {
    return new VirtualArray<T>([], new Set());
  }

  get length() {
    return this._items.length;
  }

  get items(): ReadonlyArray<T> {
    return this._itemsView;
  }

  get fieldSet(): ReadonlySet<string> {
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
}
