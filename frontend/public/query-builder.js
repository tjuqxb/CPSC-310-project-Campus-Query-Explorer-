/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

let dataSetID;
let queryAllPart;
let conditionPart;
let columnPart;
let orderPart;
let groupPart;
let transformationPart;
let isWhereEmpty;
let isSort;
let isTransform;


CampusExplorer.buildQuery = function() {
    let query = {};
    getDataSetId();
    let where = getWhere();
    let options = getOptions();
    let transformations = getTransformations();
    query.WHERE = where;
    query.OPTIONS = options;
    if (isTransform) {
        query.TRANSFORMATIONS = transformations;
    }
    return query;
};

const getDataSetId = () => {
    let dataSetQueryPart = document.getElementById("tab-courses");
    if (dataSetQueryPart.classList.contains("active")) {
        dataSetID = "courses";
        queryAllPart = dataSetQueryPart.querySelector("form");
    } else {
        dataSetID = "rooms";
        queryAllPart = document.getElementById("tab-rooms").querySelector("form");
    }
    conditionPart = queryAllPart.querySelector(".conditions");
    columnPart = queryAllPart.querySelector(".columns");
    orderPart = queryAllPart.querySelector(".order");
    groupPart = queryAllPart.querySelector(".groups");
    transformationPart = queryAllPart.querySelector(".transformations");
};

const getWhere = () => {
    let type = conditionPart.querySelector(".condition-type>.control>input[checked]").value;
    let ret = {};
    let arr = getAllConditions();
    if (type === "any") {
        ret.OR = arr;
    } else if (type === "all") {
        ret.AND = arr;
    } else {
        let body = {};
        body.OR = arr;
        ret.NOT = body;
    }
    if (arr.length === 1 && (type === "any" || type === "all")) {
        ret = arr[0];
    } else if (arr.length === 1) {
        ret = {};
        ret.NOT = arr[0];
    }
    if (isWhereEmpty) {
        ret = {};
    }
    return ret;
};

const getAllConditions = () => {
    let conditionContainer = conditionPart.querySelector(".conditions-container");
    let ret = [];
    for (let ele of conditionContainer.childNodes) {
        ret.push(getOneCondition(ele));
    }
    if (ret.length === 0) {
        isWhereEmpty = true;
    } else {
        isWhereEmpty = false;
    }
    return ret;
};

const getOneCondition = (ele) => {
    let isNot = ele.querySelector(".not>input").checked; //boolean
    let field = ele.querySelector(".fields>select>option[selected]").value; //string
    let operator = ele.querySelector(".operators>select>option[selected]").text; //string IS GT LT EQ
    let term = ele.querySelector(".term").querySelector("input").value;
    if (operator !== "IS") {
        if (term.length > 0) {
            term = Number(term);
        }
    }
    let inner = {};
    field = dataSetID + "_" + field;
    inner[field] = term;
    let retBody = {};
    retBody[operator] = inner;
    let ret = {};
    if (isNot) {
        ret.NOT = retBody;
    } else {
        ret = retBody;
    }
    return ret;
};

const getOptions = () => {
    let ret = {};
    let columns = getColumns();
    let sort = getSort();
    ret.COLUMNS = columns;
    if (isSort) {
        ret.ORDER = sort;
    }
    return ret;
}

const getColumns = () => {
    let columns = [];
    columnPart.querySelectorAll(".control-group>.field>input[checked]").forEach((ele) => {
        let field = dataSetID + "_" + ele.value;
        columns.push(field);
    });
    columnPart.querySelectorAll(".control-group>.transformation>input[checked]").forEach((ele) => {
        columns.push(ele.value);
    });
    return columns;
};

const getSort = () => {
    let keys = [];
    orderPart.querySelectorAll(".control-group>.fields>select>option[selected]").forEach((ele) => {
        if (ele.classList.contains("transformation")) {
            keys.push(ele.value);
        } else {
            keys.push(dataSetID + "_" + ele.value);
        }
    });
    if (keys.length === 0) {
        isSort = false;
    } else  {
        isSort = true;
    }
    let dir = "UP";
    if (orderPart.querySelector(".control-group>.descending>input").checked) {
        dir = "DOWN";
    }
    let ret = {};
    ret.dir = dir;
    ret.keys = keys;
    return ret;
};

const getTransformations = () => {
    let ret = {};
    let group = getGroup();
    let apply = getApply();
    ret.GROUP = group;
    ret.APPLY = apply;
    return ret;
}

const getGroup = () => {
    let ret = [];
    groupPart.querySelectorAll(".control-group>.field>input[checked]").forEach((ele) => {
        ret.push(dataSetID + "_" + ele.value);
    });
    if (ret.length === 0) {
        isTransform = false;
    } else  {
        isTransform = true;
    }
    return ret;
};

const getApply = ()=> {
    let ret = [];
    transformationPart.querySelectorAll(".transformations-container>.transformation").forEach((ele) => {
        ret.push(getSingleApply(ele));
    })
    return ret;
};

const getSingleApply = (ele)=> {
    let applyKey = ele.querySelector(".term>input").value;
    let token = ele.querySelector(".operators>select>option[selected]").value;
    let field = ele.querySelector(".fields>select>option[selected]").value;
    let fieldName = dataSetID + "_" + field;
    let innerToken = {};
    innerToken[token] = fieldName;
    let ret = {};
    ret[applyKey] = innerToken;
    return ret;
};




