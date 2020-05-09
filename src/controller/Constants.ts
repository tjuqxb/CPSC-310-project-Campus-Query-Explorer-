import {InsightError} from "./IInsightFacade";
import * as fs from "fs-extra";
import Log from "../Util";

export const Constants: { [s: string]: string} = {

  Avg: "avg",
  Pass: "pass",
  Fail: "fail",
  Audit: "audit",
  Year: "year",

  Dept: "dept",
  Id: "id",
  instructor: "Professor",
  Title: "title",
  Uuid: "uuid"

};

export const Constants0: { [s: string]: string} = {

    avg: "avg",
    pass: "pass",
    fail: "fail",
    audit: "audit",
    year: "year",
    dept: "dept",
    id: "id",
    professor: "instructor",
    title: "title",
    uuid: "uuid"

};

export const fileKeys: string[] = [
    "Title",
    "id",
    "Professor",
    "Audit",
    "Year",
    "Pass",
    "Fail",
    "Avg"
];

export const hasValidField = (o: any): boolean => {
    let keys = Object.keys(o);
    for (let expectKey of fileKeys) {
        if (!keys.includes(expectKey)) {
            return false;
        }
    }
    if (typeof o.Title !== "string") {
        return false;
    }
    if (typeof o.id !== "number") {
        return false;
    }
    if (typeof o.Professor !== "string") {
        return false;
    }
    if (typeof o.Audit !== "number") {
        return false;
    }
    if (typeof o.Year !== "string") {
        return false;
    } else if (isNaN(Number(o.Year))) {
        return false;
    }
    if (typeof o.Pass !== "number" || typeof o.Fail !== "number" || typeof o.Avg !== "number") {
        return false;
    }
    return true;
};

export const idCheck = (id: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const idRegA: RegExp = /^.*_.*$/;
        const idRegB: RegExp = /^\s*$/;
        if (!(idRegA.test(id) || idRegB.test(id))) {
            resolve("sucess");
        } else  {
            reject(new InsightError("data set ID mistake"));
        }
    });
};

export const removeDataFromDisk = (id: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        try {
            fs.removeSync("./data/" + id);
            resolve("success");
        } catch (e) {
            Log.trace(e);
            reject(new InsightError("remove disk fail"));
        }
    });
};

export const removeAllDisk = (): Promise<string[]> => {
    let files = fs.readdirSync("./data");
    let promises: Array<Promise<string>> = [];
    files.forEach((name) => {
        promises.push(removeDataFromDisk(name));
    });
    return Promise.all(promises);
};

export const validFile = (file: any): boolean => {
    if (typeof file !== "object") {
        return false;
    }
    if (file === null || file === undefined) {
        return false;
    } else if (!(Object.keys(file).includes("result")) || !(file.result instanceof Array)) {
        return false;
    }
    return true;
};
