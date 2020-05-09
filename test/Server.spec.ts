import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import * as fs from "fs-extra";
import * as buffer from "buffer";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    let dataRoom: any;
    let dataCourses: any;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        server.start().then(function (val: boolean) {
            Log.info("App::initServer() - started: " + val);
        }).catch(function (err: Error) {
            Log.error("App::initServer() - ERROR: " + err.message);
        });
        dataCourses = fs.readFileSync("./test/data/courses.zip");
        dataRoom = fs.readFileSync("./test/data/rooms.zip");
        // TODO: start server here once and handle errors properly
    });

    after(function () {
        server.stop();
        // TODO: stop server here once!
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Sample on how to format PUT requests

    it("PUT test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms/rooms")
                .send(dataRoom)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace(res.body);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace("chai request " + err);
        }
    });


    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
