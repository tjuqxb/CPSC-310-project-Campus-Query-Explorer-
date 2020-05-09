import * as fs from "fs-extra";
import Log from "./src/Util";
import {InsightDatasetKind, InsightError} from "./src/controller/IInsightFacade";
import InsightFacade from "./src/controller/InsightFacade";
import {request} from "http";

const nameRegex = /^courses\/[^\/]*$/g;
let s2: {[a: string]: number};
let ss = [{a: 1}, {b: 2}];
fs.writeFileSync("../data/" + "test", JSON.stringify(ss));
let files = fs.readdirSync("../data/");
let filesD: string[] = fs.readdirSync("../data");
let content: string = fs
    .readFileSync("./test/data/courses.zip")
    .toString("base64");
let testInsight: InsightFacade = new InsightFacade();
testInsight.addDataset("courses", content, InsightDatasetKind.Courses).then((data1) => {
    Log.info(data1);
}).then((info) => {
   return testInsight.addDataset("ss", content, InsightDatasetKind.Courses);
}).then((data) => {
    return testInsight.listDatasets();
}).then((data) => {
    Log.trace(data);
    return testInsight.performQuery(aa);
}).then((data) => {
   fs.writeFileSync("./result.json", JSON.stringify(data));
   let str00 = fs.readFileSync("./compare.json", {encoding: "UTF-8"});
   let str01 = fs.readFileSync("./result.json", {encoding: "UTF-8"});
   let data00 = JSON.parse(str00);
   let data01 = JSON.parse(str01);
}).catch((err: any) => {
    Log.error(err);
});
testInsight.listDatasets().then((data) => {
   Log.trace(data);
});

let str: string = "ABC123";
const reg = /^([A-Z]+)([0-9])+[A-Z]*$/;
let group = reg.exec(str);
Log.trace(group[1]);
Log.trace(typeof group[2]);
Log.trace({a: {}});
let reg2 = /^(\*)?[^*]*(\*)?$/;
Log.trace("reg2" + reg2.test("**he"));
let aa  = {
    WHERE: {
        OR: [
            {
                AND: [
                    {
                        GT: {
                            courses_avg: 90
                        }
                    }

                ]
            },
            {
                EQ: {
                    courses_avg: 95
                }
            }
        ]
    },
    OPTIONS: {
        COLUMNS: [
            "courses_dept",
            "courses_id",
            "courses_avg"
        ],
        ORDER: "courses_avg"
    }
};

let str1 = "\n            MGYM          ";
let str2 = "\n            6081 University Blvd          ";
let regT = /^\n\s+([^\s]+.+[^\s]+)\s+$/;
let group1 = regT.exec(str2);
let str3 = group1[1].replace(/\s+/gi, "%20");

Log.trace(str3);

const getGeoLocation = (addr: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        let address = addr.replace(/\s+/gi, "%20");
        Log.trace(address);
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
                Log.trace(JSON.parse(chunk.toString()));
                resolve(JSON.parse(chunk.toString()));
            });
        }).end();
    });
};

getGeoLocation("6245 Agronomy Road V6T 1Z4").then((data) => {
    Log.trace(typeof data);
});

let numStr = "\n            40          ";
let regNumber = /^\n\s+([^\s]+)\s+$/;
Log.trace(regNumber.exec(numStr)[1]);

let nn = new InsightFacade();
nn.listDatasets().then((data) => {
    Log.trace("List Test");
    Log.trace(data);
});

