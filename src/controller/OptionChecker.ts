import QueryValidate from "./QueryValidate";
import Log from "../Util";

export default class OptionChecker {
    private currentMField: string[];
    private currentSField: string[];
    private transformField: string[];
    private queryValidate: QueryValidate;
    private columns: string[];
    private readonly dirs = ["UP", "DOWN"];

    constructor(mField: string[], sField: string[], transformField: string[], queryValidate: QueryValidate) {
        this.currentMField = mField;
        this.currentSField = sField;
        this.transformField = transformField;
        this.queryValidate = queryValidate;
        this.columns = [];
    }

    public check(item: any): boolean {
        if (!this.queryValidate.checkValidObject(item)) {
            return false;
        } else if (Object.keys(item).length === 1) {
            if (Object.keys(item)[0] !== "COLUMNS") {
                return false;
            }
            return this.checkColumns(item.COLUMNS);
        } else if (Object.keys(item).length === 2) {
            if (Object.keys(item)[0] !== "COLUMNS" || Object.keys(item)[1] !== "ORDER") {
                return false;
            }
            return this.checkColumns(item.COLUMNS) && this.checkOrder(item.ORDER);
        } else {
            return false;
        }
    }

    private checkColumns(item: any) {
        if (!(item instanceof Array)) {
            return false;
        }
        if (item.length === 0) {
            return false;
        }
        for (let val of Object.values(item)) {
            if (!this.checkSingleColumn(val)) {
                return false;
            }
        }
        return true;
    }

    private checkSingleColumn(item: any): boolean {
        let ret: boolean;
        if (Object.keys(this.transformField). length === 0) {
            if (!QueryValidate.checkKeyFormat(item)) {
                return false;
            }
            let arr: string[] = item.split("_");
            ret = this.queryValidate.checkDataSetId(arr[0]) &&
                (this.currentSField.includes(item) || this.currentMField.includes(item));
        } else {
            if (typeof item !== "string") {
                return false;
            }
            ret = this.transformField.includes(item);
        }
        if (ret) {
            this.columns.push(item);
        }
        return ret;
    }

    private checkOrder(item: any) {
        if (typeof item === "string") {
            return this.columns.includes(item);
        }
        return this.checkOrderObject(item);
    }

    private checkOrderObject(item: any) {
        if (! this.queryValidate.checkValidObject(item)) {
            return false;
        } else if (Object.keys(item).length !== 2) {
            return false;
        } else if (Object.keys(item)[0] !== "dir" || Object.keys(item)[1] !== "keys") {
            return false;
        }
        return this.checkOrderDir(item.dir) && this.checkOrderKeys(item.keys);
    }

    private checkOrderDir(item: any): boolean {
        return this.dirs.includes(item);
    }

    private checkOrderKeys(item: any): boolean {
        if (! (item instanceof Array)) {
            return false;
        } else if (item.length === 0) {
            return false;
        } else {
            for (let val of item) {
                if (! this.columns.includes(val)) {
                    return false;
                }
            }
        }
        return true;
    }
}


