// LOAD LIBS
const { sequelize } = require("../models"); // Pastikan sequelize di-import dari models atau tempat yang sesuai
const { v4: uuidv4 } = require("uuid");

/**
 * Format JSON response
 *
 * @returns {string} - WA Instance Id
 */
function generateWAInstanceId() {
  const uuid = uuidv4();
  return `instance-${uuid}`;
}

/**
 * Format JSON response
 *
 * @param {Object} res - The response object from Express.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Response message.
 * @param {Object} [data] - Optional data to include in the response.
 */
const formatResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    message: message,
    data: data,
  });
};

/**
 * Generate next auto-increment value for a given table and composite primary key.
 *
 * @param {string} tableName - The name of the table.
 * @param {string[]} primaryKeyColumns - Array of primary key column names.
 * @returns {Promise<number>} - The next auto-increment value.
 */
async function generateAutoIncrement(tableName, primaryKeyColumns) {
  try {
    // Generate SQL query to get the max value of the primary key
    const primaryKeyColumnsString = primaryKeyColumns.join(", ");
    const query = `
            SELECT MAX(CONCAT_WS('-', ${primaryKeyColumnsString})) AS maxKey
            FROM ${tableName};
        `;

    // Execute the query
    const [result] = await sequelize.query(query);
    const maxKey = parseInt(result[0]?.maxKey) || 0;

    return maxKey + 1;
  } catch (error) {
    console.error("Error generating auto-increment value:", error);
    throw error;
  }
}

const phoneNumberFormatter = function (number) {
  // 1. Menghilangkan karakter selain angka
  let formatted = number.replace(/\D/g, "");

  // 2. Menghilangkan angka 0 di depan (prefix)
  //    Kemudian diganti dengan 62
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substr(1);
  }

  if (!formatted.endsWith("@c.us")) {
    formatted += "@c.us";
  }

  return formatted;
};

module.exports = {
  formatResponse,
  generateWAInstanceId,
  generateAutoIncrement,
  phoneNumberFormatter,
};
