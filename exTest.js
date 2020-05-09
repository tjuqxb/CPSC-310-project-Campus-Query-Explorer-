"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const Util_1 = require("./src/Util");
const IInsightFacade_1 = require("./src/controller/IInsightFacade");
const InsightFacade_1 = require("./src/controller/InsightFacade");
const http_1 = require("http");
const nameRegex = /^courses\/[^\/]*$/g;
let s2;
let ss = [{ a: 1 }, { b: 2 }];
fs.writeFileSync("../data/" + "test", JSON.stringify(ss));
let files = fs.readdirSync("../data/");
let filesD = fs.readdirSync("../data");
let content = fs
    .readFileSync("./test/data/courses.zip")
    .toString("base64");
let testInsight = new InsightFacade_1.default();
testInsight.addDataset("courses", content, IInsightFacade_1.InsightDatasetKind.Courses).then((data1) => {
    Util_1.default.info(data1);
}).then((info) => {
    return testInsight.addDataset("ss", content, IInsightFacade_1.InsightDatasetKind.Courses);
}).then((data) => {
    return testInsight.listDatasets();
}).then((data) => {
    Util_1.default.trace(data);
    return testInsight.performQuery(aa);
}).then((data) => {
    fs.writeFileSync("./result.json", JSON.stringify(data));
    let str00 = fs.readFileSync("./compare.json", { encoding: "UTF-8" });
    let str01 = fs.readFileSync("./result.json", { encoding: "UTF-8" });
    let data00 = JSON.parse(str00);
    let data01 = JSON.parse(str01);
}).catch((err) => {
    Util_1.default.error(err);
});
testInsight.listDatasets().then((data) => {
    Util_1.default.trace(data);
});
let str = "ABC123";
const reg = /^([A-Z]+)([0-9])+[A-Z]*$/;
let group = reg.exec(str);
Util_1.default.trace(group[1]);
Util_1.default.trace(typeof group[2]);
Util_1.default.trace({ a: {} });
let reg2 = /^(\*)?[^*]*(\*)?$/;
Util_1.default.trace("reg2" + reg2.test("**he"));
let aa = {
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
Util_1.default.trace(str3);
const getGeoLocation = (addr) => {
    return new Promise((resolve, reject) => {
        let address = addr.replace(/\s+/gi, "%20");
        Util_1.default.trace(address);
        http_1.request({
            host: "cs310.students.cs.ubc.ca",
            path: "/api/v1/project_team163/" + address,
            method: "GET",
            port: "11316"
        }, (response) => {
            const { statusCode } = response;
            if (statusCode === 404) {
                reject(new IInsightFacade_1.InsightError(address));
            }
            response.on("data", (chunk) => {
                Util_1.default.trace(JSON.parse(chunk.toString()));
                resolve(JSON.parse(chunk.toString()));
            });
        }).end();
    });
};
getGeoLocation("6245 Agronomy Road V6T 1Z4").then((data) => {
    Util_1.default.trace(typeof data);
});
let numStr = "\n            40          ";
let regNumber = /^\n\s+([^\s]+)\s+$/;
Util_1.default.trace(regNumber.exec(numStr)[1]);
let nn = new InsightFacade_1.default();
nn.listDatasets().then((data) => {
    Util_1.default.trace("List Test");
    Util_1.default.trace(data);
});
//# sourceMappingURL=exTest.js.map