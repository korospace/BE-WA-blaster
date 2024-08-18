// LOAD LIBS
const { ValidationError } = require('sequelize');

// MODELS
const { User, WaNumber, sequelize } = require('../models');

// HELPERS
const { generateAutoIncrement } = require('../helpers/utils');

class WaNumberService {
    /**
     * Get All WA Number
     * 
     * @param {any} loginInfo
     * 
     * @returns {Promise<{
     *    code: number, 
     *    message: string, 
     *    data: {wa_number_id: number, user_id: number, name: string, number: string}[] | null
     * }>} 
     */
    async getAll(loginInfo) {
        try {
            // where clause
            const whereClause = loginInfo.UserLevel.name === 'superadmin'
                ? { deleted: 0 } 
                : { deleted: 0, user_id: loginInfo.user_id }; 

            // models include
            const includeOption = loginInfo.UserLevel.name === 'superadmin'
                ? [{
                    model: User,
                    attributes: ['user_id', 'email'],
                    as: 'user'
                }]
                : [];

            const dt = await WaNumber.findAll({
                attributes: ['wa_number_id', 'user_id', 'name', 'number'],
                where: whereClause,
                include: includeOption
            });

            return {
                code: 200,
                message: 'wa number get all',
                data: dt
            };
        } catch (error) {
            return {
                code: 500,
                message: 'Error - WaNumberService - getAll: ' + error.message,
                data: null
            }; 
        }
    }

    /**
     * Create WA Number
     * 
     * @param {any} data
     * @param {any} loginInfo
     * 
     * @returns {Promise<{
     *    code: number, 
     *    message: string, 
     *    data: {wa_number_id: number, user_id: number, name: string, number: string} | null
     * }>} 
     */
    async create(data, loginInfo) {
        try {
            let wa_number_id = await generateAutoIncrement('wa_number', ['wa_number_id']);

            // user_id from payload if 'superadmin'
            const userId = loginInfo.UserLevel.name === 'superadmin'
                ? data.user_id
                : loginInfo.user_id;

            // check user_id is exist if 'superadmin'
            if (loginInfo.UserLevel.name === 'superadmin') {
                const dtUser = await User.findByPk(data.user_id);
                if (!dtUser) {
                    return {
                        code: 404,
                        message: 'user not found',
                        data: null
                    };
                }
            }

            // create data
            await WaNumber.create({
                wa_number_id: wa_number_id,
                user_id: userId,
                name: data.name, 
                number: data.number,
                created_by: loginInfo.user_id
            });

            return {
                code: 201,
                message: 'create wa number successfully',
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
                message: 'Error - WaNumberService - create: ' + error.message,
                data: null
            }; 
        }
    }

    /**
     * Import WA Number
     * 
     * @param {any} data
     * @param {any} loginInfo
     * 
     * @returns {Promise<{
     *    code: number, 
     *    message: string, 
     *    data: {wa_number_id: number, user_id: number, name: string, number: string}[] | null
     * }>} 
     */
    async import(data, loginInfo) {
        const transaction = await sequelize.transaction();

        try {
            let wa_number_id = await generateAutoIncrement('wa_number', ['wa_number_id']);

            // user_id from payload if 'superadmin'
            const userId = loginInfo.UserLevel.name === 'superadmin'
                ? data.user_id
                : loginInfo.user_id;

            // check user_id is exist if 'superadmin'
            if (loginInfo.UserLevel.name === 'superadmin') {
                const dtUser = await User.findByPk(data.user_id);
                if (!dtUser) {
                    await transaction.rollback();

                    return {
                        code: 404,
                        message: 'user not found',
                        data: null
                    };
                }
            }

            // insert with looping
            for (const row of data) {
                // create data
                await WaNumber.create({
                    wa_number_id: wa_number_id++,
                    user_id: userId,
                    name: row.name, 
                    number: row.number,
                    created_by: loginInfo.user_id
                }, { transaction });
            }

            await transaction.commit();

            return {
                code: 201,
                message: 'import wa number successfully',
                data
            };
        } catch (error) {
            await transaction.rollback();

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
                message: 'Error - WaNumberService - import: ' + error.message,
                data: null
            }; 
        }
    }

    /**
     * Update WA Number
     * 
     * @param {any} data
     * @param {any} loginInfo
     * 
     * @returns {Promise<{
     *    code: number, 
     *    message: string, 
     *    data: {wa_number_id: number, user_id: number, name: string, number: string} | null
     * }>} 
     */
    async update(payload, loginInfo) {
        try {
            const dtWaNumber = await WaNumber.findByPk(payload.wa_number_id);

            if (!dtWaNumber) {
                return {
                    code: 404,
                    message: 'wa number not found',
                    data: null
                };
            } else {
                // user_id from payload if 'superadmin'
                const userId = loginInfo.UserLevel.name === 'superadmin'
                    ? data.user_id
                    : loginInfo.user_id;

                // check user_id is exist if 'superadmin'
                if (loginInfo.UserLevel.name === 'superadmin') {
                    const dtUser = await User.findByPk(data.user_id);
                    if (!dtUser) {
                        return {
                            code: 404,
                            message: 'user not found',
                            data: null
                        };
                    }
                }

                // check is user has this wa number
                if (loginInfo.UserLevel.name === 'client') {
                    const dtCheck = await WaNumber.findOne({
                        where:{
                            wa_number_id: payload.wa_number_id,
                            user_id: userId
                        }
                    });
                    if (!dtCheck) {
                        return {
                            code: 404,
                            message: 'wa number not found',
                            data: null
                        };
                    }
                }

                // update data
                await WaNumber.update(
                    {
                        user_id: userId,
                        name: payload.name, 
                        number: payload.number,
                        updated_by: loginInfo.user_id,
                        updated_at: new Date()
                    },
                    {
                        where: { wa_number_id: payload.wa_number_id },
                        individualHooks: true
                    },
                );
    
                return {
                    code: 200,
                    message: 'update wa number successfully',
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
                message: 'Error - WaNumberService - update: ' + error.message,
                data: null
            }; 
        }
    }

    /**
     * Delete User
     * 
     * @param {string} wa_number_id
     * @param {any} loginInfo
     * 
     * @returns {Promise<{
     *    code: number, 
     *    message: string, 
     *    data: null
     * }>} 
     */
    async delete(wa_number_id, loginInfo) {
        try {
            let dtWaNumber; 

            if (loginInfo.UserLevel.name === 'client') {
                dtWaNumber = await WaNumber.findOne({
                    where:{
                        wa_number_id: wa_number_id,
                        user_id: loginInfo.user_id
                    }
                });
            } else {
                dtWaNumber = await WaNumber.findByPk(wa_number_id);
            }

            if (!dtWaNumber) {
                return {
                    code: 404,
                    message: 'wa number not found',
                    data: null
                };
            } else {
                await WaNumber.update(
                    {
                        deleted: 1,
                        deleted_by: loginInfo.user_id,
                        deleted_at: new Date()
                    },
                    {
                        where: { wa_number_id: wa_number_id },
                    },
                );
    
                return {
                    code: 200,
                    message: 'delete wa number successfully',
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
                message: 'Error - WaNumberService - delete: ' + error.message,
                data: null
            }; 
        }
    }
}

module.exports = new WaNumberService();
