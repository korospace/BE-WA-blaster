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
        data: data
    });
}

module.exports = {
    formatResponse
};
