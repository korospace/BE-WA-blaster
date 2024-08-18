// LOAD LIBS
const { ValidationError } = require('sequelize');

// MODELS
const { User } = require('../models');

// HELPERS
const { generateAutoIncrement } = require('../helpers/utils');

class UserService {
    /**
     * Get All User
     * 
     * @returns {Promise<{
     *    code: number, 
     *    message: string, 
     *    data: {user_id: number, user_level_id: number, email: string}[] | null
     * }>} 
     */
    async getAll() {
        try {
            const dtUsers = await User.findAll({
                attributes: ['user_id', 'user_level_id', 'email'],
                where:{
                    deleted: 0
                }
            });

            return {
                code: 200,
                message: 'user get all',
                data: dtUsers
            };
        } catch (error) {
            return {
                code: 500,
                message: 'Error - UserService - getAll: ' + error.message,
                data: null
            }; 
        }
    }

    /**
     * Create User
     * 
     * @param {any} data
     * @param {any} loginInfo
     * 
     * @returns {Promise<{
     *    code: number, 
     *    message: string, 
     *    data: {user_id: number, user_level_id: number, email: string} | null
     * }>} 
     */
    async create(data, loginInfo) {
        try {
            let user_id = await generateAutoIncrement('user', ['user_id']);

            await User.create({
                user_id: user_id,
                user_level_id: data.user_level_id, 
                email: data.email,
                password: data.password,
                created_by: loginInfo.user_id
            });

            return {
                code: 201,
                message: 'create user successfully',
                data
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                // Extract and format validation errors
                const extractedErrors = error.errors.reduce((acc, err) => {
                    if (!acc[err.path]) {
                        acc[err.path] = [];
                    }
                    acc[err.path].push(err.message);
                    return acc;
                }, {});

                return {
                    code: 400,
                    message: 'invalid request',
                    data: extractedErrors
                };
            }

            return {
                code: 500,
                message: 'Error - UserService - create: ' + error.message,
                data: null
            }; 
        }
    }

    /**
     * Update User
     * 
     * @param {any} data
     * @param {any} loginInfo
     * 
     * @returns {Promise<{
     *    code: number, 
     *    message: string, 
     *    data: {user_id: number, user_level_id: number, email: string} | null
     * }>} 
     */
    async update(payload, loginInfo) {
        try {
            const dtUser = await User.findByPk(payload.user_id);

            if (!dtUser) {
                return {
                    code: 404,
                    message: 'user not found',
                    data: null
                };
            } else {
                await User.update(
                    {
                        user_level_id: payload.user_level_id,
                        email: payload.email,
                        password: payload.password ? payload.password : dtUser.password,
                        updated_by: loginInfo.user_id,
                        updated_at: new Date()
                    },
                    {
                        where: { user_id: payload.user_id },
                        individualHooks: true
                    },
                );
    
                return {
                    code: 200,
                    message: 'update user successfully',
                    data: payload
                };
            }
        } catch (error) {
            if (error instanceof ValidationError) {
                // Extract and format validation errors
                const extractedErrors = error.errors.reduce((acc, err) => {
                    if (!acc[err.path]) {
                        acc[err.path] = [];
                    }
                    acc[err.path].push(err.message);
                    return acc;
                }, {});

                return {
                    code: 400,
                    message: 'invalid request',
                    data: extractedErrors
                };
            }

            return {
                code: 500,
                message: 'Error - UserService - update: ' + error.message,
                data: null
            }; 
        }
    }

    /**
     * Delete User
     * 
     * @param {string} user_id
     * @param {any} loginInfo
     * 
     * @returns {Promise<{
     *    code: number, 
     *    message: string, 
     *    data: null
     * }>} 
     */
    async delete(user_id, loginInfo) {
        try {
            const dtUser = await User.findByPk(user_id);

            if (!dtUser) {
                return {
                    code: 404,
                    message: 'user not found',
                    data: null
                };
            } else {
                await User.update(
                    {
                        deleted: 1,
                        deleted_by: loginInfo.user_id,
                        deleted_at: new Date()
                    },
                    {
                        where: { user_id: user_id },
                    },
                );
    
                return {
                    code: 200,
                    message: 'delete user successfully',
                    data: null
                };
            }
        } catch (error) {
            if (error instanceof ValidationError) {
                // Extract and format validation errors
                const extractedErrors = error.errors.reduce((acc, err) => {
                    if (!acc[err.path]) {
                        acc[err.path] = [];
                    }
                    acc[err.path].push(err.message);
                    return acc;
                }, {});

                return {
                    code: 400,
                    message: 'invalid request',
                    data: extractedErrors
                };
            }

            return {
                code: 500,
                message: 'Error - UserService - delete: ' + error.message,
                data: null
            }; 
        }
    }
}

module.exports = new UserService();
