// LOAD LIBS
const { ValidationError } = require("sequelize");

// MODELS
const { User, WaCampaign } = require("../models");

// HELPERS
const { generateAutoIncrement } = require("../helpers/utils");

class WaCampaignService {
  /**
   * Get All WA Campaign
   *
   * @param {string} userId
   * @param {any} loginInfo
   *
   * @returns {Promise<{
   *    code: number,
   *    message: string,
   *    data: {wa_campaign_id: number, user_id: number, text: string}[] | null
   * }>}
   */
  async getAll(userId, loginInfo) {
    try {
      // where clause
      let whereClause;
      if (loginInfo.UserLevel.name === "client") {
        whereClause = { deleted: 0, user_id: loginInfo.user_id };
      } else if (loginInfo.UserLevel.name === "superadmin") {
        if (userId) {
          whereClause = { deleted: 0, user_id: userId };
        } else {
          whereClause = { deleted: 0 };
        }
      }

      // models include
      const includeOption =
        loginInfo.UserLevel.name === "superadmin"
          ? [
              {
                model: User,
                attributes: ["user_id", "email"],
                as: "user",
              },
            ]
          : [];

      const dt = await WaCampaign.findAll({
        attributes: ["wa_campaign_id", "user_id", "text"],
        where: whereClause,
        include: includeOption,
      });

      return {
        code: 200,
        message: "wa campaign get all",
        data: dt,
      };
    } catch (error) {
      return {
        code: 500,
        message: "Error - WaCampaignService - getAll: " + error.message,
        data: null,
      };
    }
  }

  /**
   * Create WA Campaign
   *
   * @param {any} data
   * @param {any} loginInfo
   *
   * @returns {Promise<{
   *    code: number,
   *    message: string,
   *    data: {wa_campaign_id: number, user_id: number, text: string} | null
   * }>}
   */
  async create(data, loginInfo) {
    try {
      let wa_campaign_id = await generateAutoIncrement("wa_campaign", [
        "wa_campaign_id",
      ]);

      // user_id from payload if 'superadmin'
      const userId =
        loginInfo.UserLevel.name === "superadmin"
          ? data.user_id
          : loginInfo.user_id;

      // check user_id is exist if 'superadmin'
      if (loginInfo.UserLevel.name === "superadmin") {
        const dtUser = await User.findByPk(data.user_id);
        if (!dtUser) {
          return {
            code: 404,
            message: "user not found",
            data: null,
          };
        }
      }

      // create data
      await WaCampaign.create({
        wa_campaign_id: wa_campaign_id,
        user_id: userId,
        text: data.text,
        created_by: loginInfo.user_id,
      });

      return {
        code: 201,
        message: "create wa campaign successfully",
        data,
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
          message: "invalid request",
          data: extractedErrors,
        };
      }

      return {
        code: 500,
        message: "Error - WaCampaignService - create: " + error.message,
        data: null,
      };
    }
  }

  /**
   * Update WA Campaign
   *
   * @param {any} data
   * @param {any} loginInfo
   *
   * @returns {Promise<{
   *    code: number,
   *    message: string,
   *    data: {wa_campaign_id: number, user_id: number, text: string} | null
   * }>}
   */
  async update(payload, loginInfo) {
    try {
      // user_id from payload if 'superadmin'
      const userId =
        loginInfo.UserLevel.name === "superadmin"
          ? payload.user_id
          : loginInfo.user_id;

      // check user_id is exist if 'superadmin'
      if (loginInfo.UserLevel.name === "superadmin") {
        const dtUser = await User.findByPk(userId);
        if (!dtUser) {
          return {
            code: 404,
            message: "user not found",
            data: null,
          };
        }
      }

      // check is user has this wa campaign
      const dtCheck = await WaCampaign.findOne({
        where: {
          wa_campaign_id: payload.wa_campaign_id,
          user_id: userId,
        },
      });

      if (!dtCheck) {
        return {
          code: 404,
          message: "wa campaign not found",
          data: null,
        };
      } else {
        // update data
        await WaCampaign.update(
          {
            user_id: userId,
            text: payload.text,
            updated_by: loginInfo.user_id,
            updated_at: new Date(),
          },
          {
            where: { wa_campaign_id: payload.wa_campaign_id },
            individualHooks: true,
          }
        );

        return {
          code: 200,
          message: "update wa campaign successfully",
          data: payload,
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
          message: "invalid request",
          data: extractedErrors,
        };
      }

      return {
        code: 500,
        message: "Error - WaCampaignService - update: " + error.message,
        data: null,
      };
    }
  }

  /**
   * Delete WA Campaign
   *
   * @param {string} wa_campaign_id
   * @param {any} loginInfo
   *
   * @returns {Promise<{
   *    code: number,
   *    message: string,
   *    data: null
   * }>}
   */
  async delete(wa_campaign_id, loginInfo) {
    try {
      // where clause
      let whereClause;
      if (loginInfo.UserLevel.name === "client") {
        whereClause = {
          wa_campaign_id: wa_campaign_id,
          user_id: loginInfo.user_id,
          deleted: 0,
        };
      } else if (loginInfo.UserLevel.name === "superadmin") {
        whereClause = {
          wa_campaign_id: wa_campaign_id,
          deleted: 0,
        };
      }

      let dtWaCampaign = await WaCampaign.findOne({
        where: whereClause,
      });

      if (!dtWaCampaign) {
        return {
          code: 404,
          message: "wa campaign not found",
          data: null,
        };
      } else {
        await WaCampaign.update(
          {
            deleted: 1,
            deleted_by: loginInfo.user_id,
            deleted_at: new Date(),
          },
          {
            where: { wa_campaign_id: wa_campaign_id },
          }
        );

        return {
          code: 200,
          message: "delete wa campaign successfully",
          data: null,
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
          message: "invalid request",
          data: extractedErrors,
        };
      }

      return {
        code: 500,
        message: "Error - WaCampaignService - delete: " + error.message,
        data: null,
      };
    }
  }
}

module.exports = new WaCampaignService();
