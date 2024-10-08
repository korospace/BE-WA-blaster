// HELPERS
const { formatResponse } = require("../helpers/utils");
// SERVICES
const WaInstanceService = require("../services/WaInstanceService");

class WaInstanceController {
  /**
   * Get All WA Instance
   */
  static async getAll(req, res) {
    try {
      // request query
      const user_id = req.query.user_id;

      // service logic
      const dt = await WaInstanceService.getAll(user_id, req.login_info);

      // response api
      formatResponse(res, dt.code, dt.message, dt.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Create WA Instance
   */
  static async create(req, res) {
    try {
      // request body
      let { user_id, phone_number, status } = req.body;

      // service logic
      let data = { user_id, phone_number, status };
      const dtCreate = await WaInstanceService.create(data, req.login_info);

      // response api
      formatResponse(res, dtCreate.code, dtCreate.message, dtCreate.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Blast WA Instance
   */
  static async blast(req, res) {
    try {
      // request body
      let { text } = req.body;

      // service logic
      let data = { text };
      const dtCreate = await WaInstanceService.blast(data, req.login_info);

      // response api
      formatResponse(res, dtCreate.code, dtCreate.message, dtCreate.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Logout WA Instance
   */
  static async logout(req, res) {
    try {
      // service logic
      const dtLogout = await WaInstanceService.logout(
        req.params.wa_instance_id,
        req.login_info
      );

      // response api
      formatResponse(res, dtLogout.code, dtLogout.message, dtLogout.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Delete WA Instance
   */
  static async delete(req, res) {
    try {
      // service logic
      const dtDelete = await WaInstanceService.delete(
        req.params.wa_instance_id,
        req.login_info
      );

      // response api
      formatResponse(res, dtDelete.code, dtDelete.message, dtDelete.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }
}

module.exports = WaInstanceController;
