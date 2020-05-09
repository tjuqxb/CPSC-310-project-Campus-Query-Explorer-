export default class QuerySort {
  private static customSort (value1: any, value2: any, keys: string[]): number {
    if (keys.length === 0) {
      return 0;
    }
    const currentKey = keys.shift();

    // String
    if (typeof value1[currentKey] === "string") {
      const strResult = value1[currentKey].localeCompare(value2[currentKey]);
      if (strResult !== 0) {
        return strResult;
      }
    } else {
      if (value1[currentKey] > value2[currentKey]) {
        return 1;
      } else if (value1[currentKey] < value2[currentKey]) {
        return -1;
      }
    }

    return this.customSort(value1, value2, keys);
  }

  public static sort (data: any[], keys: string[], dir?: string): void {
    data.sort((a, b) => {
      const sortKeys = [...keys];
      if (!dir) {
        return this.customSort(a, b, sortKeys);
      } else if (dir && dir === "UP") {
        return this.customSort(a, b, sortKeys);
      } else {
        return this.customSort(b, a, sortKeys);
      }
    });
  }
}
