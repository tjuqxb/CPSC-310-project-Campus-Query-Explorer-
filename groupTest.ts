import * as fs from "fs-extra";
import Log from "./src/Util";

let data = fs.readFileSync("./data/rooms").toString("UTF8");
let rooms = JSON.parse(data).data;
let originData: any[] = [];
originData.push(rooms);

const getMArrayFromOneArray = (items: any[], key: string): any[] => {
    let transform: {[value: string]: any[]} = {};
    items.forEach((item) => {
        if (!transform[item[key]]) {
            transform[item[key]] = [];
        }
        transform[item[key]].push(item);
    });
    return Object.values(transform);
};

const getMArrayFromMArray = (arrays: any[], key: string): any[] => {
    let ret: any[] = [];
    arrays.forEach((arr) => {
        let mArray = getMArrayFromOneArray(arr, key);
        mArray.forEach((singleArray) => {
            ret.push(singleArray);
        });
    });
    return ret;
};

const getMArrayMultipleKeys = (arrays: any[], keys: string[]): any[] => {
    if (keys.length === 0) {
        return  arrays;
    }
    let key = keys.shift();
    let tempArray = getMArrayFromMArray(arrays, key);
    return getMArrayMultipleKeys(tempArray, keys);
};

let result = getMArrayMultipleKeys(originData, ["rooms_furniture", "rooms_seats"]);
fs.writeFileSync("./groups.json", JSON.stringify(result));

