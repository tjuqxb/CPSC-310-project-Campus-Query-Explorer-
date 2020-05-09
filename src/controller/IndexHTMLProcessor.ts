import Log from "../Util";
import {request} from "http";
import {InsightError} from "./IInsightFacade";

export default class IndexHTMLProcessor {
    private id: string;

    constructor(id: string) {
        this.id = id;
    }

    private buildingDataSet: Array<{[attribute: string]: any}> = [];

    public getBuildingAll = ( doc: object): Promise<Array<{[attribute: string]: any}>> => {
        return new Promise<Array<{[p: string]: any}>>( (resolve, reject) => {
            this.addBuildingInfo(doc).then(() => {
                return this.getGeoLocationArray();
            }).then((arr) => {
                Log.trace(arr.length);
                for (let i = 0; i < this.buildingDataSet.length; i++) {
                    if (arr[i].lat) {
                        let latAttr  = this.id + "_" + "lat";
                        let lonAttr = this.id + "_" + "lon";
                        this.buildingDataSet[i][latAttr] = arr[i].lat;
                        this.buildingDataSet[i][lonAttr] = arr[i].lon;
                    }
                }
                Log.trace(this.buildingDataSet.length);
                return resolve(this.buildingDataSet);
            }).catch((err: any) => {
                reject(err);
            });
        });
    }

    private addBuildingInfo = (doc: object): Promise<Array<{[attribute: string]: any}>> => {
        return new Promise((resolve) => {
            this.addBuildingInfoHelper(doc);
            return resolve(this.buildingDataSet);
        });
    }

    private addBuildingInfoHelper = (o: any): void => {
        if (this.isBuildingTr(o)) {
            this.addBuildingTrInfo(o);
        }
        if (typeof o === "object" && o !== null && o.childNodes && o.childNodes instanceof Array) {
            o.childNodes.forEach((child: any) => {
                this.addBuildingInfoHelper(child);
            });
        }
    }


    private addBuildingTrInfo = (o: any): void => {
        let info: {[attr: string]: any} = {};
        for (let node of o.childNodes) {
            if (node.nodeName === "td") {
                switch (node.attrs[0].value) {
                    case "views-field views-field-field-building-code":
                        let shortNameAttr = this.id + "_" + "shortname";
                        info[shortNameAttr] = this.getFieldTextString(node);
                        break;
                    case "views-field views-field-field-building-address":
                        let address = this.getFieldTextString(node);
                        let addressAttr = this.id + "_" + "address";
                        info[addressAttr] = address;
                        break;
                    case "views-field views-field-title":
                        let fullnameAttr = this.id + "_" + "fullname";
                        info[fullnameAttr] = this.getFieldHrefString(node);
                        info.file_pos = this.getFileString(node);
                        break;
                }
            }
            let repeat = false;
            for (let item of this.buildingDataSet) {
                if (item.rooms_shortname === info.rooms_shortname) {
                    repeat = true;
                    break;
                }
            }
            if (!repeat) {
                this.buildingDataSet.push(info);
            }
        }
    }

    private getGeoLocationArray = (): Promise<any[]> => {
        let promises: Array<Promise<any>> = [];
        this.buildingDataSet.forEach((o) => {
            promises.push(this.getGeoLocation(o.rooms_address));
        });
        return Promise.all(promises);
    }

    private getGeoLocation = (addr: string): Promise< {
        lat?: number;
        lon?: number;
        error?: string;
    }> => {
        return new Promise((resolve, reject) => {
            let address = addr.replace(/\s+/gi, "%20");
            request({
                host: "cs310.students.cs.ubc.ca",
                path: "/api/v1/project_team163/" + address,
                method: "GET",
                port: "11316"
            }, (response) => {
                const{ statusCode } = response;
                if (statusCode === 404) {
                    reject(new InsightError(address));
                }
                response.on("data", (chunk) => {
                    resolve(JSON.parse(chunk.toString()));
                });
            }).end();
        });
    }

    private getFieldTextString = (o: any): string => {
        let reg = /^\n\s+([^\s]+.+[^\s])\s+$/;
        return  reg.exec(o.childNodes[0].value)[1];
    }

    private getFieldHrefString = (o: any): string => {
        let nodeHref: any;
        for (let node of o.childNodes) {
            if (node.nodeName === "a") {
                nodeHref = node;
                break;
            }
        }
        return  nodeHref.childNodes[0].value;
    }

    private getFileString = (o: any): string => {
        let nodeHref: any = {};
        for (let node of o.childNodes) {
            if (node.nodeName === "a") {
                nodeHref = node;
                break;
            }
        }
        let str: string = "";
        for (let node of nodeHref.attrs) {
            if (node.name === "href") {
                str = node.value;
            }
        }
        return  str;
    }

    private isBuildingTr = (o: any): boolean => {
        if (typeof o === "object" && o !== null && o.nodeName && o.nodeName === "tr") {
            if (o.childNodes && o.childNodes instanceof Array && o.childNodes.length > 0) {
                for (let node of o.childNodes) {
                    if (node.nodeName === "td") {
                        if (node.attrs && node.attrs instanceof Array) {
                            for (let element of node.attrs) {
                                if (element.name === "class" &&
                                    element.value === "views-field views-field-field-building-code") {
                                    return  true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

}
