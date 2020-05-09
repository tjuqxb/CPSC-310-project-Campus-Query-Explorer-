import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs-extra";
import {Constants0, fileKeys, hasValidField, idCheck, removeDataFromDisk, removeAllDisk, validFile} from "./Constants";
import Log from "../Util";

export default class DataGeneratorForCourse {
    private tempRecords: number;
    private deptRecords: string[];
    private courseIdRecords: string[];
    private id: string;
    private zip: JSZip;

    constructor(id: string, zip: JSZip) {
        this.id = id;
        this.zip = zip;
        this.tempRecords = 0;
        this.deptRecords = [];
        this.courseIdRecords = [];
    }

    public loadCourseData(id: string, zipData: JSZip): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            this.getZipFiles(zipData).then((data: JSZip) => {
                return this.getZipFilesStringArray(data);
            }).then((stringsArray: string[]) => {
                return this.getZipFilesObjectArray(stringsArray);
            }).then((fileArray: any[]) => {
                return this.getRecordArray(id, fileArray);
            }).then((data) => {
                resolve(data);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    private getZipFiles(zipData: JSZip): Promise<JSZip> {
        return new Promise<JSZip>((resolve, reject) => {
            let allFiles = zipData.files;
            for (let fileName of Object.keys(allFiles)) {
                Log.trace(allFiles[fileName].name);
                if (allFiles[fileName].dir === true && allFiles[fileName].name === "courses/") {
                    return resolve(zipData);
                }
            }
            return reject(new InsightError("no course folder"));
        });
    }

    private getZipFilesStringArray(zipData: JSZip): Promise<string[]> {
        let promises: Array<Promise<string>> = [];
        let allFiles = zipData.files;
        Object.keys(allFiles).forEach((fileName: string) => {
            if (allFiles[fileName].dir === false) {
                const nameRegex1 = /^courses\/[^\/]*$/g;
                const nameRegex = /^courses\/([A-Z]+)([0-9]+[A-Z]*)$/g;
                if (nameRegex1.test(fileName)) {
                    let group = nameRegex.exec(fileName);
                    let dept: string = group[1];
                    let id: string = group[2];
                    this.deptRecords.push(dept.toLowerCase());
                    this.courseIdRecords.push(id);
                    promises.push(this.zip.file(fileName).async("text"));
                }
            }
        });
        return Promise.all(promises);
    }

    private getZipFilesObjectArray(stringsArray: string[]): Promise<any> {
        let promises: Array<Promise<any>> = [];
        for (let i = 0; i < stringsArray.length; i++) {
           promises.push(this.promiseJSONParse(stringsArray[i], this.deptRecords[i], this.courseIdRecords[i]));
        }
        return Promise.all(promises);
    }

    private promiseJSONParse(str: string, dept: string, cid: string): Promise<object> {
        return new Promise<object>((resolve) => {
            try {
                let fileObj = JSON.parse(str);
                fileObj.dept = dept;
                fileObj.courseId = cid;
                resolve(fileObj);
            } catch (e) {
                // ignore
            }
        });
    }

    private getRecordArray(id: string, fileArray: any[]): Promise<any> {
        let promises: Array<Promise<object>> = [];
        fileArray.forEach((data: any) => {
            if (validFile(data)) {
                for (let record of data.result) {
                    if (this.validRecord(record)) {
                        this.tempRecords++;
                        record.dept = data.dept;
                        let uuid = record.id;
                        delete record[id];
                        record.id = data.courseId;
                        record.uuid = uuid.toString();
                        if (Object.keys(record).includes("Section") && record.Section === "overall") {
                            record.Year = 1900;
                        } else {
                            record.Year = Number(record.Year);
                        }
                        let returnObj: {[s: string]: any} = {};
                        for (let ele of Object.keys(record)) {
                            let value = record[ele];
                            let ell = ele.toLowerCase();
                            if (Object.keys(Constants0).includes(ell)) {
                                let newKey = id + "_" + Constants0[ell];
                                returnObj[newKey] = value;
                            }
                        }
                        for (let key of Object.values(Constants0)) {
                            let updateKey = id + "_" + key;
                            if (returnObj[updateKey] === undefined) {
                                returnObj[updateKey] = "";
                            }
                        }
                        promises.push(Promise.resolve(returnObj));
                    }
                }
            }
        });
        return Promise.all(promises);
    }

    private validRecord(record: any): boolean {
        if (typeof record !== "object") {
            return false;
        }
        if (record === null || record === undefined) {
            return false;
        } else if (!hasValidField(record)) {
            return false;
        }
        return true;
    }
}
