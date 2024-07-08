"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /**
   * Static method to find all companies based on provided filters.
   *
   * @param {Object} filter - The filter object containing the query parameters.
   * @param {string} [filter.name] - The name of the company to filter by.
   * @param {number} [filter.minEmployees] - The minimum number of employees to filter by.
   * @param {number} [filter.maxEmployees] - The maximum number of employees to filter by.
   *
   * @returns {Promise<Array>} A promise that resolves to an array of company objects.
   */

  static async findAll(filter) {
    const { query, queryValues } = this.QueryCreator(filter);
    const companiesRes = await db.query(query, queryValues);
    return companiesRes.rows;
  }
  /**
   * Static method to create a SQL query for retrieving companies based on provided filters.
   *
   * @param {Object} filter - The filter object containing the query parameters.
   * @param {string} [filter.name] - The name of the company to filter by.
   * @param {number} [filter.minEmployees] - The minimum number of employees to filter by.
   * @param {number} [filter.maxEmployees] - The maximum number of employees to filter by.
   *
   * @throws {BadRequestError} Throws an error if `minEmployees` is greater than `maxEmployees`.
   *
   * @returns {Object} An object containing the SQL query string and the query values.
   */
  static QueryCreator(filter) {
    if (
      filter.hasOwnProperty("minEmployees") &&
      filter.hasOwnProperty("maxEmployees")
    ) {
      if (Number(filter.minEmployees) > Number(filter.maxEmployees)) {
        console.log("in filter");
        throw new BadRequestError(
          `minEmployees can't be greater than maxEmployees}`
        );
      }
    }

    let query = `
    SELECT handle,
           name,
           description,
           num_employees AS "numEmployees",
           logo_url AS "logoUrl"
    FROM companies
  `;
    // Initialize an array to hold the WHERE clauses
    const whereClauses = [];
    // Initialize an array to hold the query values
    const queryValues = [];

    // Conditionally add filters
    if (filter.name) {
      queryValues.push(`%${filter.name}%`);
      whereClauses.push(`name ILIKE $${queryValues.length}`);
    }

    if (filter.minEmployees !== undefined) {
      queryValues.push(filter.minEmployees);
      whereClauses.push(`num_employees >= $${queryValues.length}`);
    }

    if (filter.maxEmployees !== undefined) {
      queryValues.push(filter.maxEmployees);
      whereClauses.push(`num_employees <= $${queryValues.length}`);
    }

    // If there are any WHERE clauses, add them to the query
    if (whereClauses.length > 0) {
      query += "WHERE " + whereClauses.join(" AND ");
    }

    // Add the ORDER BY clause
    query += " ORDER BY name";
    const result = { query: query, queryValues: queryValues };
    return result;
  }
  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const jobs = await db.query(
      `SELECT
            id,
            title,
            salary,
            equity
      FROM jobs
      WHERE company_handle= $1`,
      [handle]
    );
    const company = companyRes.rows[0];
    if (jobs.rows.length > 0) {
      company.jobs = jobs.rows;
    }

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
