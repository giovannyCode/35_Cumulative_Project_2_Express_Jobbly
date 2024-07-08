const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("Tests helper function sqlForPartialUpdate ", function () {
  test(" Generates a SQL string for a partial update", function () {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name" };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("Generates a bad request when data not sent", function () {
    expect(() => {
      sqlForPartialUpdate("", "");
    }).toThrow(BadRequestError);
  });
});
