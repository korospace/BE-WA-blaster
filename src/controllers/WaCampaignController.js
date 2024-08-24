// LOAD LIBS
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
// HELPERS
const { formatResponse } = require("../helpers/utils");
// SERVICES
const WaCampaignService = require("../services/WaCampaignService");

class WaCampaignController {
  /**
   * Get All WA Campaign
   */
  static async getAll(req, res) {
    try {
      // request query
      const user_id = req.query.user_id;

      // service logic
      const dt = await WaCampaignService.getAll(user_id, req.login_info);

      // response api
      formatResponse(res, dt.code, dt.message, dt.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Create WA Campaign
   */
  static async create(req, res) {
    try {
      // request body
      let { user_id, text } = req.body;

      // service logic
      let data = { user_id, text };
      const dtCreate = await WaCampaignService.create(data, req.login_info);

      // response api
      formatResponse(res, dtCreate.code, dtCreate.message, dtCreate.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Update WA Campaign
   */
  static async update(req, res) {
    try {
      // request body
      let { wa_campaign_id, user_id, text } = req.body;

      // service logic
      let data = { wa_campaign_id, user_id, text };
      const dtUpdate = await WaCampaignService.update(data, req.login_info);

      // response api
      formatResponse(res, dtUpdate.code, dtUpdate.message, dtUpdate.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Delete WA Campaign
   */
  static async delete(req, res) {
    try {
      // service logic
      const dtDelete = await WaCampaignService.delete(
        req.params.wa_campaign_id,
        req.login_info
      );

      // response api
      formatResponse(res, dtDelete.code, dtDelete.message, dtDelete.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }
}

module.exports = WaCampaignController;
