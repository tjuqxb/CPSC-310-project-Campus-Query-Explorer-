import Log from "./src/Util";

let a = "";
let b: {[k: string]: any} = {};
b[a] = 3;
let c = JSON.parse(JSON.stringify(b));
let s = "s";
Log.trace(Object.values(b));
Log.trace(undefined === 1);


