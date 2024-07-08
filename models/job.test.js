"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "Full Stack Developer",
    salary: 100000,
    equity: "0.5",
    company_handle: "c1",
  };

  test("Inserts job on table Jobs", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "Full Stack Developer",
      salary: 100000,
      equity: "0.5",
      company_handle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${job.id}`
    );
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "Full Stack Developer",
        salary: 100000,
        equity: "0.5",
        company_handle: "c1",
      },
    ]);
  });
});

describe("Update a Job", function () {
  test("Updates a job  for a job Id", async function () {
    let newjob = await Job.create({
      title: "Full Stack Developer",
      salary: 100000,
      equity: "0.5",
      company_handle: "c1",
    });

    let updatejob = await Job.update(newjob.id, {
      title: "Junior Developer",
      salary: 90000,
      equity: "0.1",
    });
    expect(updatejob).toEqual({
      id: expect.any(Number),
      title: "Junior Developer",
      salary: 90000,
      equity: "0.1",
      company_handle: "c1",
    });
  });

  test("Tries to update a job sending id in data", async function () {
    let newjob = await Job.create({
      title: "Full Stack Developer",
      salary: 100000,
      equity: "0.5",
      company_handle: "c1",
    });

    try {
      let updatejob = await Job.update(newjob.id, {
        id: newjob.id,
        title: "Junior Developer",
        salary: 90000,
        equity: "0.1",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }

    try {
      let updatejob = await Job.update(newjob.id, {
        title: "Junior Developer",
        salary: 90000,
        equity: "0.1",
        company_handle: "c1",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("remove", function () {
  test("works", async function () {
    let newjob = await Job.create({
      title: "Full Stack Developer",
      salary: 100000,
      equity: "0.5",
      company_handle: "c1",
    });
    await Job.remove(newjob.id);
    const res = await db.query("SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(500);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("Gets a job", function () {
  test("works", async function () {
    let newjob = await Job.create({
      title: "Full Stack Developer",
      salary: 100000,
      equity: "0.5",
      company_handle: "c1",
    });

    const res = await Job.get(newjob.id);
    expect(res).toEqual({
      id: res.id,
      title: "Full Stack Developer",
      salary: 100000,
      equity: "0.5",
      company_handle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(500);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
