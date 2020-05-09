"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("./src/Util");
let a = "";
let b = {};
b[a] = 3;
let c = JSON.parse(JSON.stringify(b));
let s = "s";
Util_1.default.trace(Object.values(b));
Util_1.default.trace(undefined === 1);
//# sourceMappingURL=smallTest.js.map