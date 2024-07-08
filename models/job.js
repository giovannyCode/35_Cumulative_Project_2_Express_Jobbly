"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(
      `INSERT INTO jobs
           ( title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity , company_handle`,
      [title, salary, equity, company_handle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, tittle, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */
  static async update(id, data) {
    if ("id" in data || "company_handle" in data) {
      throw new BadRequestError("Cannot update id or company_handle of a job");
    }

    const { setCols, values } = sqlForPartialUpdate(data, {});
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle`;
    console.log(querySql);
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }

  static async get(id) {
    const JobRes = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle                 
           FROM Jobs
           WHERE id = $1`,
      [id]
    );

    const job = JobRes.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);

    return job;
  }

  static async findAll(filter) {
    const { query, queryValues } = this.QueryCreator(filter);
    const jobsRes = await db.query(query, queryValues);
    return jobsRes.rows;
  }

  static QueryCreator(filter) {
    let query = `
    SELECT id,
           title,
           salary,
           equity,
           company_handle  
    FROM jobs
  `;
    // Initialize an array to hold the WHERE clauses
    const whereClauses = [];
    // Initialize an array to hold the query values
    const queryValues = [];

    // Conditionally add filters
    if (filter.title) {
      queryValues.push(`%${filter.title}%`);
      whereClauses.push(`title ILIKE $${queryValues.length}`);
    }

    if (filter.minSalary !== undefined) {
      queryValues.push(filter.minSalary);
      whereClauses.push(`salary >= $${queryValues.length}`);
    }

    if (filter.hasEquity !== undefined && filter.hasEquity == "true") {
      queryValues.push("0");
      whereClauses.push(`equity > $${queryValues.length}`);
    }

    // If there are any WHERE clauses, add them to the query
    if (whereClauses.length > 0) {
      query += "WHERE " + whereClauses.join(" AND ");
    }

    // Add the ORDER BY clause
    query += " ORDER BY title";
    const result = { query: query, queryValues: queryValues };
    return result;
  }
}

module.exports = Job;
