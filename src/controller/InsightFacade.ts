import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
} from "./IInsightFacade";
import { InsightError, NotFoundError } from "./IInsightFacade";
import * as fs from "fs-extra";
import * as JSZip from "jszip";
import QueryEngine from "./QueryEngine";
import DataManager from "./DataManager";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private ids: string[];
    private dataSets: {[id: string]: object[]};
    private dataManager: DataManager;
    private dataStat: InsightDataset[];
    private queryEngine: QueryEngine;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.ids = [];
        this.dataStat = [];
        this.dataSets = {};
        this.dataManager = new DataManager(this.ids, this.dataSets, this.dataStat);
        this.queryEngine = new QueryEngine(this.dataSets, this.dataStat);
    }

    /**
     * Add a dataset to insightUBC.
     *
     * @param id  The id of the dataset being added. Follows the format /^[^_]+$/
     * @param content  The base64 content of the dataset. This content should be in the form of a serialized zip file.
     * @param kind  The kind of the dataset
     *
     * @return Promise <string[]>
     *
     * The promise should fulfill on a successful add, reject for any failures.
     * The promise should fulfill with a string array,
     * containing the ids of all currently added datasets upon a successful add.
     * The promise should reject with an InsightError describing the error.
     *
     * An id is invalid if it contains an underscore, or is only whitespace characters.
     * If id is the same as the id of an already added dataset, the dataset should be rejected and not saved.
     *
     * After receiving the dataset, it should be processed into a data structure of
     * your design. The processed data structure should be persisted to disk; your
     * system should be able to load this persisted value into memory for answering
     * queries.
     *
     * Ultimately, a dataset must be added or loaded from disk before queries can
     * be successfully answered.
     */
    public addDataset(
        id: string,
        content: string,
        kind: InsightDatasetKind,
    ): Promise<string[]> {
        return this.dataManager.loadZipData(id, content, kind);
    }

    public removeDataset(id: string): Promise<string> {
        return this.dataManager.removeDataset(id);
    }

    public performQuery(query: any): Promise<any[]> {
        return this.dataManager.clearCache().then(() => {
            return this.dataManager.loadData();
        }).then(() => {
            return this.queryEngine.query(query);
        });
    }

    public validateQuery(query: any): Promise<boolean> {
        return this.dataManager.clearCache().then(() => {
            return this.dataManager.loadData();
        }).then(() => {
            return this.queryEngine.testValidataQuery(query);
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return this.dataManager.listData();
    }
}
