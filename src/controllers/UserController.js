// HELPERS
const { formatResponse } = require('../helpers/utils')
// SERVICES

class UserController {
    /**
     * Get All User
     */
    static async getAll(req,res) {
        try {
            // response api
            formatResponse(res, 200, 'user list')
        } catch (error) {
            formatResponse(res, 500, error.message)
        }
    }
}

module.exports = UserController;