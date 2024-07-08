"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    database: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false,
    },
    user: "postgres",
    password: "postgres",
  });
} else {
  db = new Client({
    database: getDatabaseUri(),
    user: "postgres",
    password: "postgres",
  });
}

db.connect();

module.exports = db;
