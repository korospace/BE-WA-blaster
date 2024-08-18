// HELPERS
const { formatResponse } = require('../helpers/utils')
// SERVICES
const UserService = require('../services/UserService');

class UserController {
    /**
     * Get All User
     */
    static async getAll(req,res) {
        try {
            // service logic
            const dtUsers = await UserService.getAll();

            // response api
            formatResponse(res, dtUsers.code, dtUsers.message, dtUsers.data)
        } catch (error) {
            formatResponse(res, 500, error.message)
        }
    }

    /**
     * Create User
     */
    static async create(req,res) {
        try {
            // request body
            let {email,password,user_level_id} = req.body;

            // service logic
            let data       = {email,password,user_level_id}
            const dtCreate = await UserService.create(data, req.login_info);

            // response api
            formatResponse(res, dtCreate.code, dtCreate.message, dtCreate.data)
        } catch (error) {
            formatResponse(res, 500, error.message)
        }
    }

    /**
     * Update User
     */
    static async update(req,res) {
        try {
            // request body
            let {user_id,email,password,user_level_id} = req.body;

            // service logic
            let data       = {user_id,email,password,user_level_id}
            const dtUpdate = await UserService.update(data, req.login_info);

            // response api
            formatResponse(res, dtUpdate.code, dtUpdate.message, dtUpdate.data)
        } catch (error) {
            formatResponse(res, 500, error.message)
        }
    }

    /**
     * Delete User
     */
    static async delete(req,res) {
        try {
            // service logic
            const dtDelete = await UserService.delete(req.params.user_id, req.login_info);

            // response api
            formatResponse(res, dtDelete.code, dtDelete.message, dtDelete.data)
        } catch (error) {
            formatResponse(res, 500, error.message)
        }
    }
}

module.exports = UserController;