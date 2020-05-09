import { expect } from "chai";
import * as fs from "fs-extra";
import {
    InsightDataset,
    InsightDatasetKind,
    InsightError, NotFoundError
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Helper Function test", () => {
    let insightFacade: InsightFacade;

    beforeEach(function () {
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        insightFacade = new InsightFacade();
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });
});

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    // including ID errors and repeat in tests.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        secondValidCourses: "./test/data/courses.zip",
        _courses: "./test/data/courses01.zip",
        notZip: "./test/data/notAZip.txt",
        noCourseFolder: "./test/data/noCourseFolder.zip",
        noValidCourse: "./test/data/noValidCourse.zip",
        wrongFolderName: "./test/data/folder.zip",
        [" "]: "./test/data/folder.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                Log.trace(err);
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Should add two valid datasets", function () {
        const id: string = "courses";
        const id2: string = "secondValidCourses";
        const expected: string[] = [id, id2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
                    expect(result).to.deep.equal(expected);
            }).catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Duplicate IDs, Should throw InsightError", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result) => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
                expect.fail("should have rejected");
            }).catch((err: any) => {
                Log.trace(err);
                expect(err instanceof InsightError).to.deep.equal(true);
            });
    });

    it("id format error, Should throw InsightError", function () {
        const id: string = "_courses";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail("should have rejected");
            })
            .catch((err: any) => {
                expect(err instanceof InsightError).to.deep.equal(true);
            });
    });

    it("id format error, Should throw InsightError", function () {
        const id: string = " ";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail("should have rejected");
            })
            .catch((err: any) => {
                expect(err instanceof InsightError).to.deep.equal(true);
            });
    });

    it("id no exist, Should throw InsightError", function () {
        const id: string = "notExist";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail("should have rejected");
            })
            .catch((err: any) => {
                expect(err instanceof InsightError).to.deep.equal(true);
            });
    });

    it("file is not zip, Should throw InsightError", function () {
        const id: string = "noZip";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail("should have rejected");
            })
            .catch((err: any) => {
                expect(err instanceof InsightError).to.deep.equal(true);
            });
    });

    it("wrong folder name, Should throw InsightError", function () {
        const id: string = "wrongFolderName";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail("should have rejected");
            })
            .catch((err: any) => {
                expect(err instanceof InsightError).to.deep.equal(true);
            });
    });

    it("zip not contain course folder, Should throw InsightError", function () {
        const id: string = "noCourseFolder";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail("should have rejected");
            })
            .catch((err: any) => {
                expect(err instanceof InsightError).to.deep.equal(true);
            });
    });

    it("no valid course, Should throw InsightError", function () {
        const id: string = "noValidCourse";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail("should have rejected");
            })
            .catch((err: any) => {
                expect(err instanceof InsightError).to.deep.equal(true);
            });
    });

    it("Should remove a valid dataset", function () {
        const id: string = "courses";
        const expected: string = id;
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result) => {
            return insightFacade.removeDataset(id);
        }).catch((err) => {
            expect.fail("Should not have rejected");
        }).then((result: string) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("invalid ID, should throw InsightError", function () {
        const id: string = "_courses";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail("should have rejected");
            })
            .catch((err: any) => {
                expect(err instanceof InsightError).to.deep.equal(true);
            });
    });

    it("invalid ID, should throw InsightError", function () {
        const id: string = " ";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail("should have rejected");
            })
            .catch((err: any) => {
                expect(err instanceof InsightError).to.deep.equal(true);
            });
    });

    it("ID not added, should throw NotFoundError", function () {
        const id: string = "notAdd";
        return insightFacade
            .removeDataset(id)
            .then((result: string) => {
                expect.fail("should have rejected");
            })
            .catch((err: any) => {
                expect(err instanceof NotFoundError).to.deep.equal(true);
            });
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        courses: {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises).then((values) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries.
    // Creates an extra "test" called "Should run test queries" as a byproduct.
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    const resultChecker = TestUtil.getQueryChecker(test, done);
                    insightFacade.performQuery(test.query)
                        .then(resultChecker)
                        .catch(resultChecker);
                });
            }
        });
    });
});

describe("InsightFacade list Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    // including ID errors and repeat in tests.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should perform no dataSet added", function () {
        const expected: InsightDataset[] = [];
        return insightFacade
            .listDatasets()
            .then((result: InsightDataset[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    // This is a unit test. You should create more like this!
    it("Should list a valid dataset", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result) => {
            return insightFacade
                .listDatasets();
        }).catch((err) => {
            expect.fail("Should not have rejected");
        }).then((result: InsightDataset[]) => {
                expect(result[0]).to.have.deep.property("id", id);
                expect(result[0]).to.have.deep.property(
                    "kind",
                    InsightDatasetKind.Courses,
                );
            })
            .catch((err: any) => {
                expect.fail("Should not have rejected");
            });
    });
});
