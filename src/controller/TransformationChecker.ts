import QueryValidate from "./QueryValidate";

export default class TransformationChecker {
    private currentMField: string[];
    private currentSField: string[];
    private transformField: string[];
    private queryValidate: QueryValidate;
    private applyToken = ["MAX", "MIN", "AVG" , "COUNT" , "SUM"];

    constructor(mField: string[], sField: string[], transformField: string[], queryValidate: QueryValidate) {
        this.currentMField = mField;
        this.currentSField = sField;
        this.transformField = transformField;
        this.queryValidate = queryValidate;
    }

    public check(trans: any): boolean {
        if (!this.queryValidate.checkValidObject(trans)) {
            return false;
        } else if (Object.keys(trans).length !== 2) {
            return false;
        } else if (Object.keys(trans)[0] !== "GROUP" || Object.keys(trans)[1] !== "APPLY") {
            return false;
        }
        return this.checkGroup(trans.GROUP) && this.checkApply(trans.APPLY);
    }

    private checkGroup(item: any): boolean {
        if (!(item instanceof Array)) {
            return false;
        } else if (item.length === 0) {
            return false;
        }
        for (let val of Object.values(item)) {
            if (!this.checkSingleField(val)) {
                return false;
            } else {
                this.transformField.push(val);
            }
        }
        return true;
    }

    private checkSingleField(item: any): boolean {
        let ret: boolean;
        if (!QueryValidate.checkKeyFormat(item)) {
            return false;
        }
        let arr: string[] = item.split("_");
        ret = this.queryValidate.checkDataSetId(arr[0]) &&
            (this.currentSField.includes(item) || this.currentMField.includes(item));
        return ret;
    }

    private checkApply(item: any): boolean {
        if (!(item instanceof Array)) {
            return false;
        }
        for (let val of Object.values(item)) {
            if (!this.checkSingleApplyRule(val)) {
                return false;
            } else {
                if (this.transformField.includes(Object.keys(val)[0])) {
                    return false;
                }
                this.transformField.push(Object.keys(val)[0]);
            }
        }
        return true;
    }

    private checkSingleApplyRule(item: any) {
        const idRegA: RegExp = /^.*_.*$/;
        if (!this.queryValidate.checkValidObject(item)) {
            return false;
        } else if (Object.keys(item).length !== 1) {
            return false;
        } else if (idRegA.test(Object.keys(item)[0])) {
            return false;
        }
        return this.checkApplyToken(Object.values(item)[0]);
    }

    private checkApplyToken(item: any) {
        if (!this.queryValidate.checkValidObject(item)) {
            return false;
        } else if (Object.keys(item).length !== 1) {
            return false;
        }
        if (!this.applyToken.includes(Object.keys(item)[0])) {
            return false;
        }
        return this.checkTokenType(item);
    }

    private checkTokenType(item: any): boolean {
        let field = Object.values(item)[0];
        if (typeof field !== "string") {
            return false;
        }
        if (Object.keys(item)[0] === "COUNT") {
            return (this.currentMField.includes(field) || this.currentSField.includes(field));
        } else {
            return this.currentMField.includes(field);
        }
    }
}
