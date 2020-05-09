"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
let data = fs.readFileSync("./data/rooms").toString("UTF8");
let rooms = JSON.parse(data).data;
let originData = [];
originData.push(rooms);
const getMArrayFromOneArray = (items, key) => {
    let transform = {};
    items.forEach((item) => {
        if (!transform[item[key]]) {
            transform[item[key]] = [];
        }
        transform[item[key]].push(item);
    });
    return Object.values(transform);
};
const getMArrayFromMArray = (arrays, key) => {
    let ret = [];
    arrays.forEach((arr) => {
        let mArray = getMArrayFromOneArray(arr, key);
        mArray.forEach((singleArray) => {
            ret.push(singleArray);
        });
    });
    return ret;
};
const getMArrayMultipleKeys = (arrays, keys) => {
    if (keys.length === 0) {
        return arrays;
    }
    let key = keys.shift();
    let tempArray = getMArrayFromMArray(arrays, key);
    return getMArrayMultipleKeys(tempArray, keys);
};
let result = getMArrayMultipleKeys(originData, ["rooms_furniture", "rooms_seats"]);
fs.writeFileSync("./groups.json", JSON.stringify(result));
//# sourceMappingURL=groupTest.js.map