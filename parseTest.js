"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const Util_1 = require("./src/Util");
const IInsightFacade_1 = require("./src/controller/IInsightFacade");
const DataManager_1 = require("./src/controller/DataManager");
const InsightFacade_1 = require("./src/controller/InsightFacade");
let htmlString = fs.readFileSync("./test/data/rooms/index.htm").toString("UTF-8");
let parse5 = require("parse5");
let doc = parse5.parse(htmlString);
Util_1.default.trace(doc);
let nodeName = "a";
let searchArrayField = "attrs";
let name = "href";
let links = new Set();
const addBuildingLink = (o) => {
    if (typeof o === "object" && o !== null && o.nodeName && o.nodeName === "tr") {
        if (o.attrs && o.attrs instanceof Array && o.attrs.length > 0) {
            for (let attribute of o.attrs) {
                let regValueBuilding = /^.\/campus\/discover\/buildings-and-classrooms\/([0-9a-zA-Z]+)$/;
                if (attribute.name && attribute.name === "href") {
                    if (attribute.value && typeof attribute.value === "string") {
                        let strArr = regValueBuilding.exec(attribute.value);
                        if (strArr && strArr.length > 0) {
                            links.add(attribute.value);
                        }
                    }
                }
            }
        }
    }
    if (typeof o === "object" && o !== null && o.childNodes && o.childNodes instanceof Array) {
        o.childNodes.forEach((child) => {
            addBuildingLink(child);
        });
    }
};
addBuildingLink(doc);
let content = fs
    .readFileSync("./test/data/rooms.zip")
    .toString("base64");
let content2 = fs
    .readFileSync("./test/data/courses.zip")
    .toString("base64");
let query1 = {
    WHERE: {},
    OPTIONS: {
        COLUMNS: ["courses_title", "overallAvg"]
    },
    TRANSFORMATIONS: {
        GROUP: ["courses_title"],
        APPLY: [{
                overallAvg: {
                    AVG: "courses_avg"
                }
            }]
    }
};
let query2 = {
    WHERE: {
        AND: [{
                IS: {
                    rooms_furniture: "*Tables*"
                }
            }, {
                GT: {
                    rooms_seats: 300
                }
            }]
    },
    OPTIONS: {
        COLUMNS: [
            "rooms_shortname",
            "maxSeats"
        ],
        ORDER: {
            dir: "DOWN",
            keys: ["maxSeats"]
        }
    },
    TRANSFORMATIONS: {
        GROUP: ["rooms_shortname"],
        APPLY: [{
                maxSeats: {
                    MAX: "rooms_seats"
                }
            }]
    }
};
new DataManager_1.default([], {}, []).loadZipData("rooms", content, IInsightFacade_1.InsightDatasetKind.Rooms).then((data) => {
    return new DataManager_1.default([], {}, []).loadZipData("courses", content2, IInsightFacade_1.InsightDatasetKind.Courses);
}).then((data) => {
    return new InsightFacade_1.default().validateQuery(query2);
}).then((val) => {
    Util_1.default.trace("query2: " + val);
});
//# sourceMappingURL=parseTest.js.map