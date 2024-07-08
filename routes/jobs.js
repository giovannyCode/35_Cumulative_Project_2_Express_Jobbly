"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const { ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const router = new express.Router();
/**
 * @function
 * @description Handles the creation of a new job entry. Validates the request body against a predefined schema and, if valid, creates a new job in the database. If the request body is invalid or any other error occurs, an appropriate error is thrown and handled.
 *
 * @name POST /
 *
 * @middleware
 * @param {function} ensureLoggedIn - Middleware to ensure the user is logged in.
 *
 * @param {Object} req - The request object containing the request body.
 * @param {Object} res - The response object used to send back the desired HTTP response.
 * @param {function} next - The next middleware function in the stack.
 *
 * @returns {Object} JSON response containing the created job object or an error message.
 *
 * @example
 * // Request Body
 * {
 *   // job details conforming to jobNewSchema
 * }
 *
 * // Success Response (201 Created)
 * {
 *   "job": {
 *     // job details
 *   }
 * }
 *
 * // Error Response (400 Bad Request)
 * {
 *   "error": {
 *     "message": ["error details"]
 *   }
 * }
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/**
 * @module JobRouter
 */

/**
 * @function
 * @description Handles the update of an existing job entry. Validates the request body against a predefined schema and, if valid, updates the job in the database. If the request body is invalid or any other error occurs, an appropriate error is thrown and handled.
 *
 * @name PATCH /:id
 *
 * @middleware
 * @param {function} ensureLoggedIn - Middleware to ensure the user is logged in.
 * @param {function} ensureIsAdmin - Middleware to ensure the user has admin privileges.
 *
 * @param {Object} req - The request object containing the request body and parameters.
 * @param {string} req.params.id - The ID of the job to update.
 * @param {Object} req.body - The request body containing the job updates.
 * @param {Object} res - The response object used to send back the desired HTTP response.
 * @param {function} next - The next middleware function in the stack.
 *
 * @returns {Object} JSON response containing the updated job object or an error message.
 *
 * @example
 * // Request Body
 * {
 *   // job updates conforming to jobUpdateSchema
 * }
 *
 * // Success Response (200 OK)
 * {
 *   "job": {
 *     // updated job details
 *   }
 * }
 *
 * // Error Response (400 Bad Request)
 * {
 *   "error": {
 *     "message": ["error details"]
 *   }
 * }
 */
router.patch(
  "/:id",
  ensureLoggedIn,
  ensureIsAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

router.get("/", async function (req, res, next) {
  try {
    // Extract specific query string parameters
    const { title, minSalary, hasEquity } = req.query;

    // Optionally, you can build a filter object based on the query parameters
    const filter = {};
    if (title) filter.title = title;
    if (minSalary) filter.minSalary = minSalary;
    if (hasEquity) filter.hasEquity = hasEquity;
    // Pass the filter object to the Job.findAll function
    const jobs = await Job.findAll(filter);

    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
