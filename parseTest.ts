import * as fs from "fs-extra";
import Log from "./src/Util";
import {request} from "http";
import {InsightDatasetKind, InsightError} from "./src/controller/IInsightFacade";
import DataGeneratorForRoom from "./src/controller/DataGeneratorForRoom";
import DataManager from "./src/controller/DataManager";
import InsightFacade from "./src/controller/InsightFacade";

let htmlString = fs.readFileSync("./test/data/rooms/index.htm").toString("UTF-8");

// Useful Examples
let parse5 = require("parse5");


let doc = parse5.parse(htmlString);
Log.trace(doc);
// returns an HTMLDocument, which also is a Document.
let nodeName = "a";
let searchArrayField = "attrs";
let name = "href";

let links: Set<string> = new Set<string>();

const addBuildingLink = (o: any): void => {
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
        o.childNodes.forEach((child: any) => {
            addBuildingLink(child);
        });
    }
};

addBuildingLink(doc);

// next part is the implementation
let content: string = fs
    .readFileSync("./test/data/rooms.zip")
    .toString("base64");

let content2: string = fs
    .readFileSync("./test/data/courses.zip")
    .toString("base64");

// addBuildingAll();

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

new DataManager([], {}, []).loadZipData("rooms", content, InsightDatasetKind.Rooms).then ((data) => {
    return  new DataManager([], {}, []).loadZipData("courses", content2, InsightDatasetKind.Courses);
}).then((data) => {
    return new InsightFacade().validateQuery(query2);
}).then((val) => {
    Log.trace("query2: " + val);
});


