import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs-extra";
import {Constants0, fileKeys, hasValidField, idCheck, removeDataFromDisk, removeAllDisk, validFile} from "./Constants";
import Log from "../Util";
import DataGeneratorForCourse from "./DataGeneratorForCourse";
import DataGeneratorForRoom from "./DataGeneratorForRoom";

export default class DataManager {
    private ids: string[];
    private dataSets: {[id: string]: object[]};
    private dataStat: InsightDataset[];
    private zip = new JSZip();

    constructor(ids: string[], dataSets: {[id: string]: object[]}, dataStat: InsightDataset[] ) {
        this.ids = ids;
        this.dataSets = dataSets;
        this.dataStat = dataStat;
    }

    public loadZipData(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return this.clearCache().then((info) => {
            return this.loadData();
        }).then((info) => {
            return idCheck(id);
        }).then((str) => {
            return this.checkExistIds(id);
        }).then((str: string) => {
            return this.loadZip(id, content);
        }).then((zipData: JSZip) => {
            switch (kind) {
                case InsightDatasetKind.Courses:
                    return new DataGeneratorForCourse(id, this.zip).loadCourseData(id, zipData);
                case InsightDatasetKind.Rooms:
                    return new DataGeneratorForRoom(id, this.zip).loadRoomData(id, zipData);
            }
        }).then((arr: object[]) => {
            return this.storeData(arr, id, kind);
        }).then((info) => {
            return removeAllDisk();
        }).then((arr) => {
            return this.saveAllToDisk();
        }).then(() => {
            return Promise.resolve(this.ids);
        });
    }

    public clearCache(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.ids.splice(0, this.ids.length);
            for (let key of Object.keys(this.dataSets)) {
                delete this.dataSets[key];
            }
            this.dataStat.splice(0, this.dataStat.length);
            resolve("success");
        });
    }

    private checkExistIds (id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (this.ids.includes(id)) {
                reject(new InsightError("id already exists"));
            } else {
                resolve("success");
            }
        });
    }

    private loadZip(id: string, content: string): Promise<JSZip> {
        return new Promise<JSZip>((resolve, reject) => {
            this.zip.loadAsync(content, {base64: true, createFolders: true}).then((zipData: JSZip) => {
                return resolve(zipData);
            }).catch((error) => {
                return reject(new InsightError("not a valid zip"));
            });
        });
    }

    private storeData(arr: object[], id: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            if (arr.length === 0) {
                return reject(new InsightError("no valid record added"));
            } else {
                let dataSetRecord: InsightDataset = {
                    id: "", kind: InsightDatasetKind.Courses, numRows: 0 };
                dataSetRecord.id = id;
                dataSetRecord.kind = kind;
                dataSetRecord.numRows = arr.length;
                this.dataStat.push(dataSetRecord);
                this.ids.push(id);
                this.dataSets[id] = arr;
                Log.trace(this.dataStat);
                return resolve(this.ids);
            }
        });
    }

    private saveAllToDisk(): Promise<string[]> {
        let promises: Array<Promise<string>> = [];
        for (let idData of this.ids) {
            promises.push(this.saveOneRecord(idData));
        }
        return Promise.all(promises);
    }

    private saveOneRecord(idData: string): Promise<string> {
        return new Promise<string> ((resolve, reject) => {
            let record: InsightDataset;
            for (let val of this.dataStat) {
                if (val.id === idData) {
                    record =  val;
                }
            }
            let arrData = this.dataSets[idData];
            let save = {insightDataset: record, data: arrData};
            let str = JSON.stringify(save);
            try {
                fs.writeFileSync("./data/" + idData, str, {encoding: "UTF8"});
                resolve("success");
            } catch (e) {
                Log.trace(e);
                reject(new InsightError("save to disk error"));
            }
        });
    }

    public loadData(): Promise<string[]> {
        return this.loadDataToPromises().then((data) => {
            return this.saveToCache(data);
        });
    }

    private loadDataToPromises(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            let files = fs.readdirSync("./data");
            let stringArray: string[] = [];
            files.forEach((fileName) => {
                stringArray.push(fs.readFileSync("./data/" + fileName, {encoding: "UTF-8"}).toString());
            });
            resolve(stringArray);
        });
    }

    private saveToCache(data: string[]): Promise<string[]> {
        return new Promise<string[]> ((resolve, reject) => {
            data.forEach((str) => {
                let obj = JSON.parse(str);
                let insightDataset: InsightDataset = obj.insightDataset;
                let arr = obj.data;
                for (let item of arr) {
                    for (let key of Object.keys(item)) {
                        if (item[key] === undefined) {
                            item[key] = "";
                        }
                    }
                }
                this.dataStat.push(insightDataset);
                this.dataSets[insightDataset.id] = arr;
                this.ids.push(insightDataset.id);
            });
            return resolve(this.ids);
        });
    }

    public removeDataset(id: string): Promise<string> {
        return this.clearCache().then((info) => {
            return this.loadData();
        }).then ((info) => {
            return idCheck(id);
        }).then((str) => {
            return this.checkExistIdsForRemove(id);
        }).then((str) => {
            return this.deleteIdInCache(id);
        }).then((str) => {
            return removeAllDisk();
        }).then ((info) => {
            return this.saveAllToDisk();
        }).then(() => {
            return Promise.resolve(id);
        });
    }

    private checkExistIdsForRemove (id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (!this.ids.includes(id)) {
                reject(new NotFoundError("id not found"));
            } else {
                resolve("success");
            }
        });
    }

    private deleteIdInCache(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
                try {
                    let index: number = this.ids.indexOf(id);
                    this.ids.splice(index, 1);
                    delete this.dataSets[id];
                    for (let index2 = 0; index2 < this.dataStat.length; index2 ++) {
                        if (this.dataStat[index2].id === id) {
                            this.dataStat.splice(index2, 1);
                            break;
                        }
                    }
                    resolve(id);
                } catch (e) {
                    reject(new InsightError("remove cache error"));
                }
            }
        );
    }

    public listData(): Promise<InsightDataset[]> {
        return this.clearCache().then((info) => {
            return this.loadData();
        }).then(() => {
            return Promise.resolve(this.dataStat);
        });
    }
}
