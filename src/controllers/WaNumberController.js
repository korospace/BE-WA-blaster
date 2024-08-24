// LOAD LIBS
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
// HELPERS
const { formatResponse } = require("../helpers/utils");
// SERVICES
const WaNumberService = require("../services/WaNumberService");

class WaNumberController {
  /**
   * Get All WA Number
   */
  static async getAll(req, res) {
    try {
      // request query
      const user_id = req.query.user_id;

      // service logic
      const dt = await WaNumberService.getAll(user_id, req.login_info);

      // response api
      formatResponse(res, dt.code, dt.message, dt.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Create WA Number
   */
  static async create(req, res) {
    try {
      // request body
      let { user_id, name, number } = req.body;

      // service logic
      let data = { user_id, name, number };
      const dtCreate = await WaNumberService.create(data, req.login_info);

      // response api
      formatResponse(res, dtCreate.code, dtCreate.message, dtCreate.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Download Import Template
   */
  static async downloadTemplate(req, res) {
    try {
      // template path
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        "import_number_template.xlsx"
      );

      // Mengirim file ke client
      res.download(filePath, (err) => {
        if (err) {
          // Jika terjadi kesalahan saat mengirim file
          formatResponse(res, 500, "Error - Could not send file", null);
        }
      });
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Import Excel
   */
  static async importExcel(req, res) {
    try {
      let { user_id } = req.body;

      // Read Uploaded Excel
      const filePath = path.join(__dirname, "..", "uploads", req.file.filename);
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Delete After Read
      fs.unlinkSync(filePath);

      // Proses data
      const data = rows.slice(1).map((row) => ({
        user_id: user_id,
        name: row[0], // column 'name'
        number: row[1], // column 'number'
      }));
      const dtCreateBulk = await WaNumberService.import(data, req.login_info);

      formatResponse(
        res,
        dtCreateBulk.code,
        dtCreateBulk.message,
        dtCreateBulk.data
      );
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Update WA Number
   */
  static async update(req, res) {
    try {
      // request body
      let { wa_number_id, user_id, name, number } = req.body;

      // service logic
      let data = { wa_number_id, user_id, name, number };
      const dtUpdate = await WaNumberService.update(data, req.login_info);

      // response api
      formatResponse(res, dtUpdate.code, dtUpdate.message, dtUpdate.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }

  /**
   * Delete WA Number
   */
  static async delete(req, res) {
    try {
      // service logic
      const dtDelete = await WaNumberService.delete(
        req.params.wa_number_id,
        req.login_info
      );

      // response api
      formatResponse(res, dtDelete.code, dtDelete.message, dtDelete.data);
    } catch (error) {
      formatResponse(res, 500, error.message);
    }
  }
}

module.exports = WaNumberController;
