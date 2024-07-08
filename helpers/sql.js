const { BadRequestError } = require("../expressError");

/**
 * Generates a SQL fragment for a partial update.
 *
 * This function takes an object containing data to update and an object that maps JavaScript
 * property names to SQL column names. It returns an object with two properties:
 * - `setCols`: a string of SQL set clause(s) for updating the specified columns.
 * - `values`: an array of values to be used in the SQL update statement.
 *
 * @param {Object} dataToUpdate - The data to update, where keys are the property names and values are the new values.
 * @param {Object} jsToSql - An object mapping JavaScript property names to SQL column names.
 *
 * @throws {BadRequestError} If no data is provided to update.
 *
 * @returns {Object} An object containing `setCols` and `values`.
 *
 * @example
 * const dataToUpdate = { firstName: 'Aliya', age: 32 };
 * const jsToSql = { firstName: 'first_name' };
 * const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
 * // result => {
 * //   setCols: '"first_name"=$1, "age"=$2',
 * //   values: ['Aliya', 32]
 * // }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
