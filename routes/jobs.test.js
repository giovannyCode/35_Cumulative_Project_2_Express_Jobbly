"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  JobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /jobs", function () {
  const newJob = {
    title: "Sofware Developer",
    salary: 100000,
    equity: 0.1,
    company_handle: "c1",
  };

  test("ok for users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        title: "Sofware Developer",
        salary: 100000,
        equity: "0.1",
        id: expect.any(Number),
        company_handle: "c1",
      },
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "Sofware Developer",
        salary: 100000,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: 0,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${JobIds[0]}`)
      .send({
        title: "C1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        title: "C1-new",
        salary: 120000,
        equity: "0.1",
        id: JobIds[0],
        company_handle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/${JobIds[0]}`).send({
      name: "C1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such Job", async function () {
    const resp = await request(app)
      .patch(`/jobs/200`)
      .send({
        title: "C1-new",
        salary: 120000,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${JobIds[0]}`)
      .send({
        title: "",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /Jobs/:id */

describe("DELETE /Jobs/:id", function () {
  test("works for users", async function () {
    const resp = await request(app)
      .delete(`/jobs/${JobIds[1]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${JobIds[1]}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/${JobIds[1]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/10000`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** findAll */
describe("GET /jobs", function () {
  test("gets all Jobs", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: JobIds[1],
          title: "Junior Software Developer",
          salary: 100000,
          equity: "0.1",
          company_handle: "c2",
        },
        {
          id: JobIds[0],
          title: "Software Developer",
          salary: 120000,
          equity: "0.1",
          company_handle: "c1",
        },
      ],
    });
  });

  test("Filter by minSalary  = 110000", async function () {
    const resp = await request(app).get("/jobs?minSalary=110000");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: JobIds[0],
          title: "Software Developer",
          salary: 120000,
          equity: "0.1",
          company_handle: "c1",
        },
      ],
    });
  });

  test("Filter by hasEquity  = true", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: JobIds[1],
          title: "Junior Software Developer",
          salary: 100000,
          equity: "0.1",
          company_handle: "c2",
        },
        {
          id: JobIds[0],
          title: "Software Developer",
          salary: 120000,
          equity: "0.1",
          company_handle: "c1",
        },
      ],
    });
  });
});
