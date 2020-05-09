import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs-extra";
import {Constants0, fileKeys, hasValidField, idCheck, removeDataFromDisk, removeAllDisk, validFile} from "./Constants";
import Log from "../Util";
import {rejects} from "assert";
import IndexHTMLProcessor from "./IndexHTMLProcessor";
import BuildingHTMLProcessor from "./BuildingHTMLProcessor";

export default class DataGeneratorForRoom {
    private id: string;
    private zip: JSZip;
    private zipData: JSZip;
    private indexHTMLData: any[];

    constructor(id: string, zip: JSZip) {
        this.id = id;
        this.zip = zip;
    }

    public loadRoomData(id: string, zipData: JSZip): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            this.getZipFiles(zipData).then((data) => {
                return this.getIndexHTMLString(data);
        }).then((htmlString: string) => {
            return this.getIndexHTMLObject(htmlString);
        }).then((dom) => {
            return this.getIndexHTMLInfo(id, dom);
        }).then((dom) => {
            return this.getEachHTMLString(dom);
        }).then((arr) => {
            return this.addEachHTMLString(arr);
        }).then((arr: any[]) => {
            return Promise.resolve(this.indexHTMLData);
        }).then((data) => {
            return this.getBuildingHTMLInfo(id, data);
        }).then((data) => {
            resolve(data);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    private getZipFiles(zipData: JSZip): Promise<JSZip> {
        return new Promise<JSZip>((resolve, reject) => {
            let allFiles = zipData.files;
            for (let fileName of Object.keys(allFiles)) {
                Log.trace(fileName);
                if (allFiles[fileName].dir === true && allFiles[fileName].name === "rooms/") {
                    this.zipData = zipData;
                    return resolve(zipData);
                }
            }
            return reject(new InsightError("no room folder"));
        });
    }


    private getIndexHTMLString(zipData: JSZip): Promise<string> {
        let allFiles = zipData.files;
        for (let fileName of Object.keys(allFiles)) {
            const nameRegex = /^rooms\/index.htm$/g;
            if (nameRegex.test(fileName)) {
                Log.trace(fileName);
                return this.zip.file(fileName).async("text");
            }
        }
    }

    private getIndexHTMLObject(htmlString: string): Promise<object> {
        return new Promise<object>((resolve, reject) => {
            try {
                let parse5 = require("parse5");
                Log.trace(htmlString.length);
                let doc = parse5.parse(htmlString);
                return resolve(doc);
            } catch (err) {
                return reject(new InsightError("index.htm parse error"));
            }
        });
    }

    private getIndexHTMLInfo(id: string, doc: object): Promise<Array<{[attribute: string]: any}>> {
        return new IndexHTMLProcessor(id).getBuildingAll(doc);
    }

    private getBuildingHTMLInfo(id: string, data: any[]): Promise<any[]> {
        return new BuildingHTMLProcessor(id).getRoomsInfoAll(data);
    }

    private getEachHTMLString(data: any[]): Promise<string[]> {
        this.indexHTMLData = data;
        let allFiles = this.zipData.files;
        let promises: Array<Promise<any>> = [];
        data.forEach((item) => {
            let filePos = item.file_pos.replace(".", "rooms");
            for (let fileName of Object.keys(allFiles)) {
                if (fileName === filePos) {
                    promises.push(this.zip.file(fileName).async("text"));
                }
            }
        });
        return Promise.all(promises);
    }

    private addEachHTMLString(arr: string[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            for (let i = 0; i < arr.length; i++) {
                this.indexHTMLData[i].HTML_string = arr[i];
            }
            return resolve(this.indexHTMLData);
        });
    }
}
