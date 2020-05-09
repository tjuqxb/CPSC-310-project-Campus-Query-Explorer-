import QuerySort from "./QuerySort";
import Log from "../Util";

/**
 * @Constants
 */
enum LOGIC {
  AND = "AND",
  OR = "OR",
  NOT = "NOT"
}

enum SCOMPARATOR {
  IS = "IS"
}

enum MCOMPARATOR {
  LT = "LT",
  GT = "GT",
  EQ = "EQ"
}

/**
 *
 * @param filter
 */
export const executeFilter = function (filter: any, datasetItem: any) {
  /**
   * @FilterOptions
   *
   * LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
   *  @LOGICCOMPARISON Recursive (AND/NOT): [ {FILTER}, ... ]
   *  @MCOMPARISON Leaf-node function execution
   *  @SCOMPARISON Leaf-node function execution
   *  @NEGATION Recursive NOT: { FILTER }
   *
   */

  let validDatasetItem = {},
      invalidDatasetItem = {};

  /**
   * Check if current filter is @SCOMPARISON
   *
   * @filter { IS: { skey: idstring_sfield } }
   */
  if (filter[SCOMPARATOR.IS]) {
    const filterValue = filter[SCOMPARATOR.IS];

    const skey = Object.getOwnPropertyNames(filterValue)[0];
    const skeyValue: any = Object.values(filterValue)[0];

    const re = new RegExp(`^${skeyValue.replace(/\*/g, "(.)*")}$`);

    if (re.test(datasetItem[skey])) {
      validDatasetItem = datasetItem;
    } else {
      invalidDatasetItem = datasetItem;
    }
  }

  /**
   * Check if current filter is @MCOMPARISON
   */
  if (filter[MCOMPARATOR.LT] || filter[MCOMPARATOR.GT] || filter[MCOMPARATOR.EQ]) {
    const filterValue = Object.values(filter)[0];

    const mkey = Object.getOwnPropertyNames(filterValue)[0];
    const mkeyValue = Object.values(filterValue)[0];

    switch (Object.getOwnPropertyNames(filter)[0]) {

      case (MCOMPARATOR.LT): {
        if (datasetItem[mkey] < mkeyValue) {
          validDatasetItem = datasetItem;
        } else {
          invalidDatasetItem = datasetItem;
        }
        break;
      }
      case (MCOMPARATOR.GT): {
        if (datasetItem[mkey] > mkeyValue) {
          validDatasetItem = datasetItem;
        } else {
          invalidDatasetItem = datasetItem;
        }
        break;
      }
      case (MCOMPARATOR.EQ): {
        if (datasetItem[mkey] === mkeyValue) {
          validDatasetItem = datasetItem;
        } else {
          invalidDatasetItem = datasetItem;
        }
        break;
      }
    }
  }

  /**
   * Check if current filter is @NEGATION
   */
  if (filter[LOGIC.NOT]) {
    const {
      valid, invalid
    }: { valid: object, invalid: object } = executeFilter(filter[LOGIC.NOT], datasetItem);


    validDatasetItem = invalid;
    invalidDatasetItem = valid;
  }

  /**
   * Check if current filter is @LOGCOMPARISON
   */
  if (filter[LOGIC.AND] || filter[LOGIC.OR]) {
    let filters: object[] = [];

    switch (Object.getOwnPropertyNames(filter)[0]) {
      case (LOGIC.AND): {
        filters = filter[LOGIC.AND];

        // Assume AND will be valid: if invalid, change value
        // If for-loop finishes, then all filters are valid
        validDatasetItem = datasetItem;

        for (let loopFilter of filters) {
          const {
            valid: loopFilterValid
          }: { valid: any, invalid: any } = executeFilter(loopFilter, datasetItem);

          // When any sub-filter returns invalid, "AND" fails
          if (Object.keys(loopFilterValid).length === 0) {
            validDatasetItem = {};
            invalidDatasetItem = datasetItem;
            break;
          }
        }
        break;
      }
      case (LOGIC.OR): {
        filters = filter[LOGIC.OR];

        // Assume AND will be invalid: if valid, change value
        // If for-loop finishes, then all filters are invalid
        invalidDatasetItem = datasetItem;

        for (let loopFilter of filters ) {
          const {
            valid: loopFilterValid
          }: { valid: any, invalid: any } = executeFilter(loopFilter, datasetItem);

          // When any sub-filter returns invalid, "AND" fails
          if (Object.keys(loopFilterValid).length !== 0) {
            validDatasetItem = datasetItem;
            invalidDatasetItem = {};
            break;
          }
        }
        break;
      }
    }
  }

  return {
    valid: validDatasetItem,
    invalid: invalidDatasetItem
  };
};

export const executeOptions = function (query: any, filteredDataset: object[]) {
  const options = query["OPTIONS"];

  const cols: string[] = options["COLUMNS"];
  const order: any = options["ORDER"];

  // Log.test("Before Filter = ", filteredDataset);

  const resultQuery = filteredDataset.map((datasetItem: any) => {
    const datasetItemWithOptions: { [s: string]: any } = {};
    cols.forEach((col: string) => {
      datasetItemWithOptions[col] = datasetItem[col];
    });
    return datasetItemWithOptions;
  });

  // Log.test("Result from Filer = ", resultQuery);

  if (!order) {
    Log.test("ORDER INVALID!");
    return resultQuery;
  } else if (typeof order === "string") {
    Log.test("SIMPLE ORDER SORT");
    QuerySort.sort(resultQuery, [order]);
  } else {
    const { dir, keys } = order;
    Log.test("COMPLEX SORT");
    QuerySort.sort(resultQuery, keys, dir);
  }

  // Log.test("After Sort = ", resultQuery);

  return resultQuery;
};
