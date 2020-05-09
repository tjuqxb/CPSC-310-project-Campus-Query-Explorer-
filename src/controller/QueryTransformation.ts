import GroupHelpers from "./GroupHelpers";
import Log from "../Util";
import Decimal from "decimal.js";

const TRANSFORMATIONS = "TRANSFORMATIONS";
const GROUP = "GROUP";
const APPLY = "APPLY";
const OPTIONS = "OPTIONS";
const COLUMNS = "COLUMNS";

enum APPLY_TYPES {
  MAX = "MAX",
  MIN = "MIN",
  AVG = "AVG",
  COUNT = "COUNT",
  SUM = "SUM",
}

type ApplyRuleType = [string, { [s: string]: string }];

export default class QueryTransformation {
  private static applySum (data: any[], key: string): number {
    const sum = data.reduce((accum, dataItem) => Number(dataItem[key]) + accum, 0);
    return Number(sum.toFixed(2));
  }

  private static applyMax (data: any[], key: string): number {
    return data.reduce((prevMax, current) => (
      current[key] > prevMax[key] ? current : prevMax
    ))[key];
  }

  private static applyMin (data: any[], key: string): number {
    return data.reduce((prevMin, current) => (
      current[key] < prevMin[key] ? current : prevMin
    ))[key];
  }

  private static applyAvg (data: any[], key: string): number {
    const sum: Decimal = data.reduce((accum: Decimal, dataItem) => {
      const dataNum = new Decimal(dataItem[key]);
      return accum.add(dataNum);
    }, new Decimal(0));
    const avg = sum.toNumber() / data.length;
    return Number(avg.toFixed(2));
  }

  private static applyCount (data: any[], key: string): number {
    const obj: { [k: string]: any } = {};
    data.forEach((dataItem) => {
      if (!obj[dataItem[key]]) {
        obj[dataItem[key]] = true;
      }
    });

    return Object.entries(obj).length;
  }

  private static applyKeyOnData(keyType: string, dataKey: string, dataGroup: any[]): number {
    switch (keyType) {
      case(APPLY_TYPES.MAX): {
        return this.applyMax(dataGroup, dataKey);
      }
      case(APPLY_TYPES.MIN): {
        return this.applyMin(dataGroup, dataKey);
      }
      case(APPLY_TYPES.AVG): {
        return this.applyAvg(dataGroup, dataKey);
      }
      case(APPLY_TYPES.COUNT): {
        return this.applyCount(dataGroup, dataKey);
      }
      case(APPLY_TYPES.SUM): {
        return this.applySum(dataGroup, dataKey);
      }
      default: {
        throw Error;
      }
    }
  }

  private static transformApply (data: any[][], columnKeys: string[], applyKeys: object[]): object[] {
    return data.map((dataGroup) => {
      const obj: { [key: string]: any } = {};

      columnKeys.forEach((key) => {
          if (Object.keys(dataGroup[0]).includes(key)) {
              obj[key] = dataGroup[0][key];
          }
      });

      applyKeys.forEach((applyKey) => {
        const [keyName, keyObj]: ApplyRuleType  = Object.entries(applyKey)[0];
        const [keyType, dataKey] = Object.entries(keyObj)[0];
        Log.test(keyName, keyObj, keyType, dataKey);
        const result = this.applyKeyOnData(keyType, dataKey, dataGroup);
        Log.test("Amount Received: ", result);
        obj[keyName] = result;
      });

      return obj;
    });
  }

  public static executeTransformations(data: object[], query: any): any[] {
    const qTransformation = query[TRANSFORMATIONS];
    if (!qTransformation) {
      return data;
    }

    Log.test("Before Transform Length = ", data.length);

    let transformedData: any[] = [data];
    const groupKeys: string[] = qTransformation[GROUP];
    if (groupKeys.length !== 0) {
      transformedData = GroupHelpers.transformGroup(transformedData, groupKeys);
    }
    for (let item of transformedData) {
        Log.trace(Object.keys(item).length);
    }

    Log.test("After Transform Length = ", transformedData.length);

    const apply = qTransformation[APPLY];
    const columns = query[OPTIONS];
    const columnKeys: string[] = columns[COLUMNS];
    if (apply) {
      transformedData = this.transformApply(transformedData, columnKeys, apply);
    }
    for (let item of transformedData) {
        Log.trace(Object.keys(item).length);
    }
    return transformedData;
  }
}
