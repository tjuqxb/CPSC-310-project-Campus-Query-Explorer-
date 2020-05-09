import {rejects} from "assert";
import {InsightDataset, InsightError, ResultTooLargeError} from "./IInsightFacade";

import QueryValidate from "./QueryValidate";
import { executeFilter, executeOptions } from "./QueryExecute";
import Log from "../Util";
import DataGeneratorForCourse from "./DataGeneratorForCourse";
import DataManager from "./DataManager";
import QueryTransformation from "./QueryTransformation";

const TRANSFORMATIONS = "TRANSFORMATIONS";

export default class QueryEngine {
    private dataSets: { [id: string]: object[] };
    private dataStat: InsightDataset[];
    private queryId: string;
    private columns: string[];
    private order: string;
    private queryValidate: QueryValidate;

    constructor(dataSets: { [id: string]: object[] }, dataStat: InsightDataset[]) {
        this.dataSets = dataSets;
        this.queryId = "";
        this.columns = [];
        this.dataStat = dataStat;
        this.queryValidate
            = new QueryValidate(this.dataSets, this.dataStat);
    }

    /**
     * @param query
     */
    public query(query: any): Promise<object[]> {
        return new Promise<object[]>((resolve, reject) => {
            this.validateQuery(query).then((dataset: object[]) => {
                return this.executeQuery(query, dataset);
            })
                .then((filteredDataset: object[]) => {
                    return this.executeQueryOptions(query, filteredDataset);
                })
                .then((items: any) => {
                    this.clearTempQueryValues();
                    resolve(items);
                })
                .catch((err: any) => {
                    this.clearTempQueryValues();
                    reject(err);
                });
        });
    }

    public testValidataQuery(query: any): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            return resolve(this.queryValidate.checkQueryAll(query));
        });
    }

    private clearTempQueryValues(): void {
        this.queryId = "";
        this.columns = [];
        this.order = "";
    }

    private validateQuery(queryObject: any): Promise<object[]> {
        return new Promise<object[]>((resolve, reject) => {
            if (this.queryValidate.checkQueryAll(queryObject) === true) {
                const id: string = this.queryValidate.getId();
                this.queryValidate.clearTempQueryValues();
                resolve(this.dataSets[id]);
            } else {
                reject(new InsightError("Invalid Query"));
            }
        });
    }

    /**
     * @executeQuery Computes the query to gather the datasets that meet the nested conditions
     *
     * @param query
     * @param dataset
     */
    private executeQuery(query: any, dataset: object[]): Promise<object[]> {
        return new Promise<object[]>((resolve, reject) => {
            const nestedQueryFilter = query["WHERE"];
            let filteredDataset = dataset;
            if (Object.keys(nestedQueryFilter).length > 0) {
                filteredDataset = dataset.filter((datasetItem: object) => {
                    const {valid}: { valid: object } = executeFilter(nestedQueryFilter, datasetItem);
                    return Object.keys(valid).length !== 0;
                });
            }
            if (filteredDataset.length > 5000 && !query[TRANSFORMATIONS]) {
                reject(new ResultTooLargeError(filteredDataset.length));
            } else {
                if (!query[TRANSFORMATIONS]) {
                    // Log.test("TRANSFORMATION NEVER RUNS");
                    resolve(filteredDataset);
                } else {
                    Log.test("TRANSFORMATION RUNS");
                    const transformedData = QueryTransformation.executeTransformations(filteredDataset, query);
                    // Log.test("Transformed Data: ", transformedData);
                    // Log.test("Number of transformedData: ", transformedData.length);
                    if (transformedData.length > 5000) {
                        reject(new ResultTooLargeError(transformedData.length));
                    } else {
                        // Log.test("Length is valid. Resolved.");
                        for (let item of transformedData) {
                           Log.trace(Object.keys(item).length);
                        }
                        resolve(transformedData);
                    }

                }
            }
        });
    }

    /**
     * @TODO
     *
     * @executeOptions Using the filtered dataset, returns the appropriate fields (columns)
     *
     * @param query
     * @param dataset
     */
    private executeQueryOptions(query: any, filteredDataset: Array<{ [v: string]: any }>): Promise<object[]> {
        return new Promise<object[]>((resolve, reject) => {
            const optionsDataset: any = executeOptions(query, filteredDataset);
            // Log.test("Options Dataset = ", optionsDataset);
            // Log.test("optionsDataset length = ", optionsDataset.length);
            return resolve(optionsDataset);
        });
    }
}
