export default class GroupHelpers {
  private static getMArrayFromOneArray (items: any[], key: string): any[] {
    const transform: {[value: string]: any[]} = {};
    items.forEach((item) => {
      if (!transform[item[key]]) {
        transform[item[key]] = [];
      }
      transform[item[key]].push(item);
    });
    return Object.values(transform);
  }

  private static getMArrayFromMArray (arrays: any[], key: string): any[] {
    const ret: any[] = [];
    arrays.forEach((arr) => {
      const mArray = this.getMArrayFromOneArray(arr, key);
      mArray.forEach((singleArray) => {
        ret.push(singleArray);
      });
    });
    return ret;
  }

  /**
   * Init private static
   * @param arrays Initial array of [rooms] for the dataset
   * @param keys ["key1", "key2", ...]
   */
  public static transformGroup (arrays: any[], keys: string[]): any[][] {
    const key = keys.shift();
    if (!key) {
      return arrays;
    }
    const accumulatorResult = this.getMArrayFromMArray(arrays, key);
    return this.transformGroup(accumulatorResult, keys);
  }

}
