import Log from "../Util";
import DataManager from "./DataManager";
import TransformationChecker from "./TransformationChecker";
import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import OptionChecker from "./OptionChecker";

export default class QueryValidate {
    private dataSets: {[id: string]: object[]};
    private readonly dataStat: InsightDataset[];
    private queryId: {id: string};
    private columns: string[];
    private transformField: string[];
    private filterKinds: string[] = ["AND", "OR", "NOT", "LT", "GT", "EQ", "IS"];
    private courseMField = ["avg", "pass", "fail", "audit", "year"];
    private courseSField = ["dept", "id", "instructor", "title", "uuid"];
    private roomMField = ["lat", "lon", "seats"];
    private roomSField = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
    private currentMField: string[] = [];
    private currentSField: string[] = [];

    constructor(dataSets: {[id: string]: object[]}, dataStat: InsightDataset[]) {
        this.dataSets = dataSets;
        this.dataStat = dataStat;
        this.queryId = {id: ""};
        this.columns = [];
        this.transformField = [];
    }

    public checkQueryAll(query: any): boolean {
        let ret: boolean;
        if (!this.checkValidObject(query)) {
            ret = false;
        } else if (!this.checkQueryFields(query)) {
            ret = false;
        } else {
            if (Object.keys(query).length === 2) {
                ret = this.checkWhere(query.WHERE) && this.checkOptions(query.OPTIONS);
            } else {
                ret = this.checkWhere(query.WHERE)
                    && this.checkTransformation(query.TRANSFORMATIONS) && this.checkOptions(query.OPTIONS);
            }
        }
        if (!ret) {
            this.clearTempQueryValues();
        }
        return ret;
    }

    private checkTransformation(trans: any): boolean {
        return new TransformationChecker(this.currentMField,
            this.currentSField, this.transformField, this).check(trans);
    }

    public getId(): string {
        return this.queryId.id;
    }

    public clearTempQueryValues(): void {
        this.queryId.id = "";
        this.columns = [];
        this.currentMField = [];
        this.currentSField = [];
        this.transformField = [];
    }

    private checkWhere(item: any): boolean {
        if (!this.checkValidObjectIncludeEmpty(item)) {
            return false;
        } else if (Object.keys(item).length === 0) {
            return true;
        }
        return this.checkFilter(item);
    }

    private checkFilter(item: any) {
        if (!this.checkValidObject(item)) {
            return false;
        } else if (!this.checkFilterKinds(item)) {
            return false;
        } else {
            return this.checkEachFilter(item);
        }
    }

    // check if it is a filter
    private checkFilterKinds(item: object): boolean {
        if (Object.keys(item).length !== 1) {
            return false;
        } else if (!this.filterKinds.includes(Object.keys(item)[0])) {
            return false;
        } else {
            return true;
        }
    }

    // check each filter
    private checkEachFilter(item: object): boolean {
        switch (Object.keys(item)[0]) {
            case "AND":
                return this.checkFilterArray(Object.values(item)[0]);
                break;
            case "OR":
                return this.checkFilterArray(Object.values(item)[0]);
                break;
            case "NOT":
                return this.checkFilter(Object.values(item)[0]);
                break;
            case "LT":
                return this.checkMathCondition(Object.values(item)[0]);
                break;
            case "GT":
                return this.checkMathCondition(Object.values(item)[0]);
                break;
            case "EQ":
                return this.checkMathCondition(Object.values(item)[0]);
                break;
            case "IS":
                return this.checkStringCondition(Object.values(item)[0]);
        }
    }

    // check string field object
    private checkStringCondition(item: any): boolean {
        if (!this.checkValidObject(item)) {
            return false;
        } else if (Object.keys(item).length !== 1 ) {
            return false;
        }
        if (!this.checkStringField(Object.keys(item)[0])) {
            return false;
        } else {
            if (typeof Object.values(item)[0] !== "string") {
                return false;
            } else {
                return this.checkStringReg(Object.values(item)[0]);
            }
        }
    }

    // check string regex format
    private checkStringReg(item: any): boolean {
        let reg = /^(\*)?[^\*]*(\*)?$/;
        return reg.test(item);
    }

    // check string field
    private  checkStringField(item: string): boolean {
        if (!QueryValidate.checkKeyFormat(item)) {
            return false;
        }
        let arr: string[] = item.split("_");
        return this.checkDataSetId(arr[0]) && this.currentSField.includes(item);
    }

    // check math field object
    private checkMathCondition(item: any): boolean {
        if (!this.checkValidObject(item)) {
            return false;
        } else if (Object.keys(item).length !== 1 ) {
            return false;
        }
        return this.checkMathField(Object.keys(item)[0]) && (typeof Object.values(item)[0] === "number");
    }

    // check math field
    private checkMathField(item: string): boolean {
        if (! QueryValidate.checkKeyFormat(item)) {
            return false;
        }
        let arr: string[] = item.split("_");
        return this.checkDataSetId(arr[0]) && this.currentMField.includes(item);
    }

    // check dataset ID
    public checkDataSetId(item: string): boolean {
        if (!Object.keys(this.dataSets).includes(item)) {
            return false;
        }
        if (this.queryId.id === "") {
            this.queryId.id = item;
            for (let dataSet of this.dataStat) {
                if (dataSet.id === item) {
                    switch (dataSet.kind) {
                        case InsightDatasetKind.Rooms:
                            this.copyField(item, this.roomMField, this.currentMField);
                            this.copyField(item, this.roomSField, this.currentSField);
                            break;
                        case InsightDatasetKind.Courses:
                            this.copyField(item, this.courseSField, this.currentSField);
                            this.copyField(item, this.courseMField, this.currentMField);
                            break;
                    }
                    break;
                }
            }
            return true;
        } else if (this.queryId.id !== item) {
            return false;
        }
        return true;
    }

    private copyField(id: any, source: any[], target: any[]): void {
        source.forEach((item) => {
            target.push(id + "_" + item);
        });
    }

    // check filter array
    private checkFilterArray(item: any): boolean {
        if (!(item instanceof Array)) {
            return false;
        } else if (item.length === 0) {
            return false;
        } else {
            for (let filter of item) {
                if (!this.checkFilter(filter)) {
                    return false;
                }
            }
            return true;
        }
    }

    // check the option field
    private checkOptions(item: any): boolean {
        return new OptionChecker(this.currentMField,
           this.currentSField, this.transformField, this).check(item);
    }

    public static checkKeyFormat(item: any): boolean {
        if (typeof item !== "string") {
            return false;
        }
        let arr: string[] = item.split("_");
        if (arr.length !== 2) {
            return false;
        }
        return true;
    }

    // check valid object(not NULL or undefined)
    private checkValidObjectIncludeEmpty(item: any): boolean {
        if (typeof item !== "object" || item instanceof Array) {
            return false;
        } else if (item === null || item === undefined) {
            return false;
        }
        return true;
    }

        // check valid object(not NULL or undefined)
    public checkValidObject(item: any): boolean {
        if (typeof item !== "object" || item instanceof Array) {
            return false;
        } else if (item === null || item === undefined) {
            return false;
        } else if (Object.keys(item).length === 0) {
            return false;
        }
        return true;
    }

    // check query keys
    private checkQueryFields(query: object) {
        if (Object.keys(query).length !== 2 && Object.keys(query).length !== 3) {
            return false;
        } else if (Object.keys(query)[0] !== "WHERE" || Object.keys(query)[1] !== "OPTIONS") {
            return false;
        } else if (Object.keys(query).length === 3 && Object.keys(query)[2] !== "TRANSFORMATIONS") {
            return false;
        }
        return true;
    }
}
