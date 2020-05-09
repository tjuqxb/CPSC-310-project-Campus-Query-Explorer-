export default class BuildingHTMLProcessor {
    private roomsDataSet: any = [];
    private id: string;
    private shortnameAttr: string;
    private fullnameAttr: string;
    private addressAttr: string;
    private latAttr: string;
    private lonAttr: string;
    private nameAttr: string;
    private numberAttr: string;
    private hrefAttr: string;
    private seatsAttr: string;
    private furnitureAttr: string;
    private typeAttr: string;

    constructor(id: string) {
        this.id = id;
        let prefix = this.id + "_";
        this.shortnameAttr = prefix + "shortname";
        this.fullnameAttr = prefix  + "fullname";
        this.addressAttr = prefix + "address";
        this.latAttr = prefix + "lat";
        this.lonAttr = prefix + "lon";
        this.nameAttr = prefix + "name";
        this.numberAttr = prefix + "number";
        this.hrefAttr = prefix + "href";
        this.seatsAttr = prefix + "seats";
        this.furnitureAttr = prefix + "furniture";
        this.typeAttr = prefix + "type";
    }

    public getRoomsInfoAll = (buildingData: any[]): Promise<Array<{[attribute: string]: any}>> => {
        return new Promise((resolve) => {
            buildingData.forEach((item) => {
                let roomSet: any[] = [];
                let parse5Building = require("parse5");
                let docBuilding = parse5Building.parse(item.HTML_string);
                this.addRoomInfoHelper(roomSet, docBuilding);
                roomSet.forEach((room) => {
                    room[this.shortnameAttr] = item[this.shortnameAttr];
                    room[this.fullnameAttr] = item[this.fullnameAttr];
                    room[this.addressAttr] = item[this.addressAttr];
                    if (item[this.latAttr]) {
                        room[this.latAttr] = item[this.latAttr];
                        room[this.lonAttr] = item[this.lonAttr];
                    }
                    room[this.nameAttr] = room[this.shortnameAttr] + "_"  + room[this.numberAttr];
                });
                for (let roomItem of roomSet) {
                    let repeat = false;
                    for (let existItem of this.roomsDataSet) {
                        if (existItem[this.nameAttr] === roomItem[this.nameAttr]) {
                            repeat = true;
                            break;
                        }
                    }
                    if (!repeat) {
                        this.roomsDataSet.push(roomItem);
                    }
                }
            });
            return resolve(this.roomsDataSet);
        });
    }

    private addRoomInfoHelper = (roomSet: any[], o: any): void => {
        if (this.isRoomTr(o)) {
            this.addRoomTrInfo(roomSet, o);
        }
        if (typeof o === "object" && o !== null && o.childNodes && o.childNodes instanceof Array) {
            o.childNodes.forEach((child: any) => {
                this.addRoomInfoHelper(roomSet, child);
            });
        }
    }

    private isRoomTr = (o: any): boolean => {
        if (typeof o === "object" && o !== null && o.nodeName && o.nodeName === "tr") {
            if (o.childNodes && o.childNodes instanceof Array && o.childNodes.length > 0) {
                for (let node of o.childNodes) {
                    if (node.nodeName === "td") {
                        if (node.attrs && node.attrs instanceof Array) {
                            for (let element of node.attrs) {
                                if (element.name === "class" &&
                                    element.value === "views-field views-field-field-room-number") {
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

    private addRoomTrInfo = (roomSet: any[], o: any): void => {
        let info: {[attr: string]: any} = {};
        for (let node of o.childNodes) {
            if (node.nodeName === "td") {
                switch (node.attrs[0].value) {
                    case "views-field views-field-field-room-number":
                        info[this.numberAttr] = this.getRoomHrefAndNumber(node).rooms_number;
                        info[this.hrefAttr] = this.getRoomHrefAndNumber(node).rooms_href;
                        break;
                    case "views-field views-field-field-room-capacity":
                        info[this.seatsAttr] = this.getRoomSeats(node);
                        break;
                    case "views-field views-field-field-room-furniture":
                        info[this.furnitureAttr] = this.getRoomFieldTextString(o, node);
                        break;
                    case "views-field views-field-field-room-type":
                        info[this.typeAttr] = this.getRoomFieldTextString(o, node);
                }
            }
        }
        roomSet.push(info);
    }

    private getRoomFieldTextString = (file: any, o: any): string => {
        let regTest = /^\n\s+([^\s]+.+[^\s]+)\s+$/;
        let reg = /^\n\s+([^\s]+.+[^\s]+)\s+$/;
        if (regTest.test(o.childNodes[0].value)) {
            return  reg.exec(o.childNodes[0].value)[1];
        } else {
            return "";
        }
    }

    private getRoomHrefAndNumber = (o: any): {[attr: string]: any} => {
        let nodeHref: any = {};
        for (let node of o.childNodes) {
            if (node.nodeName === "a") {
                nodeHref = node;
                break;
            }
        }
        let hrefStr: string = "";
        for (let node of nodeHref.attrs) {
            if (node.name === "href") {
                hrefStr = node.value;
            }
        }
        let numberStr = "";
        for (let node of nodeHref.childNodes) {
            if (node.nodeName === "#text") {
                numberStr = node.value;
            }
        }
        return  {rooms_href: hrefStr, rooms_number: numberStr};
    }

    private getRoomSeats = (o: any): number => {
        let seatsStr = "";
        for (let node of o.childNodes) {
            if (node.nodeName === "#text") {
                seatsStr = node.value;
                break;
            }
        }
        let regNumberTest = /^\n\s+([^\s]+)\s+$/;
        let regNumber = /^\n\s+([^\s]+)\s+$/;
        if (regNumberTest.test(seatsStr)) {
            seatsStr = regNumber.exec(seatsStr)[1];
            return Number(seatsStr);
        }
        return 0;
    }
}
