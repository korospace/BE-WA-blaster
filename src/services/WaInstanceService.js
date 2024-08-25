// LOAD LIBS
const { ValidationError } = require("sequelize");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const fs = require("fs").promises;
const path = require("path");

// MODELS
const { User, WaInstance, WaNumber } = require("../models");

// HELPERS
const {
  generateWAInstanceId,
  phoneNumberFormatter,
} = require("../helpers/utils");

// SOCKET
const { getSocket } = require("../socket/socket");

class WaInstanceService {
  /**
   * Get All WA Instance
   *
   * @param {string} userId
   * @param {any} loginInfo
   *
   * @returns {Promise<{
   *    code: number,
   *    message: string,
   *    data: {wa_instance_id: string, user_id: number, phone_number: string, status: string}[] | null
   * }>}
   */
  async getAll(userId = null, loginInfo) {
    try {
      // where clause
      let includeOption;
      let whereClause;

      if (loginInfo) {
        if (loginInfo.UserLevel.name === "client") {
          includeOption = [];
          whereClause = { deleted: 0, user_id: loginInfo.user_id };
        } else if (loginInfo.UserLevel.name === "superadmin") {
          includeOption = [
            {
              model: User,
              attributes: ["user_id", "email"],
              as: "user",
            },
          ];

          if (userId) {
            whereClause = { deleted: 0, user_id: userId };
          } else {
            whereClause = { deleted: 0 };
          }
        }
      } else {
        includeOption = [];
        whereClause = { deleted: 0, user_id: userId };
      }

      const dt = await WaInstance.findAll({
        attributes: [
          "wa_instance_id",
          "user_id",
          "phone_number",
          "qr_code",
          "status",
        ],
        where: whereClause,
        include: includeOption,
        order: [["created_at", "DESC"]],
      });

      // wakeup instance
      let newDt = [];
      for (const row of dt) {
        if (row.qr_code) {
          try {
            // Convert QR code to Data URL
            row.qr_code = await new Promise((resolve, reject) => {
              qrcode.toDataURL(row.qr_code, (err, url) => {
                if (err) {
                  return reject(err);
                }
                resolve(url);
              });
            });
          } catch (error) {
            console.error("Error converting QR code:", error);
          }
        }
        newDt.push(row);

        // Wake up the instance asynchronously
        await this.wakeUpInstance(row.wa_instance_id, row.user_id);
      }

      return {
        code: 200,
        message: "wa instance get all",
        data: newDt,
      };
    } catch (error) {
      return {
        code: 500,
        message: "Error - WaInstanceService - getAll: " + error.message,
        data: null,
      };
    }
  }

  /**
   * Get All WA Instance - revalidate
   *
   * @param {string} userId
   * @param {object} loginInfo
   *
   * @returns {Promise<{
   *    code: number,
   *    message: string,
   *    data: {wa_instance_id: string, user_id: number, phone_number: string, status: string}[] | null
   * }>}
   */
  async getAll_revalidate(userId, loginInfo) {
    const io = getSocket();

    try {
      const dt = await this.getAll(userId, loginInfo);

      io.to(`room:${userId}`).emit(`wainstance`, {
        code: 200,
        message: "wa instance get all revalidate",
        data: dt,
      });
      return;
    } catch (error) {
      io.to(`room:${userId}`).emit(`wainstance`, {
        code: 500,
        message:
          "Error - WaInstanceService - getAll_revalidate: " + error.message,
        data: null,
      });
    }
  }

  /**
   * Create WA Instance
   *
   * @param {any} data
   * @param {any} loginInfo
   *
   * @returns {Promise<{
   *    code: number,
   *    message: string,
   *    data: {wa_instance_id: string, user_id: number, phone_number: string, status: string} | null
   * }>}
   */
  async create(data, loginInfo) {
    try {
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
      let wa_instance_id = generateWAInstanceId();
      await WaInstance.create({
        wa_instance_id: wa_instance_id,
        user_id: userId,
        created_by: loginInfo.user_id,
      });
      this.getAll_revalidate(userId, loginInfo);
      this.wakeUpInstance(wa_instance_id, userId);

      return {
        code: 201,
        message: "create wa instance successfully",
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
        message: "Error - WaInstanceService - create: " + error.message,
        data: null,
      };
    }
  }

  /**
   * Blast WA Instance
   *
   * @param {any} data
   * @param {any} loginInfo
   *
   * @returns {Promise<{
   *    code: number,
   *    message: string,
   *    data: {text: string} | null
   * }>}
   */
  async blast(data, loginInfo) {
    try {
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

      // get numbers target
      const dtNumbers = await WaNumber.findAll({
        attributes: ["wa_number_id", "user_id", "name", "number"],
        where: { deleted: 0, user_id: userId },
      });

      // get instance
      const dtInstance = await WaInstance.findAll({
        attributes: [
          "wa_instance_id",
          "user_id",
          "phone_number",
          "qr_code",
          "status",
        ],
        where: { deleted: 0, user_id: userId, status: "ready" },
      });

      for (const number of dtNumbers) {
        const instance = global.instances[dtInstance[0].wa_instance_id];
        await instance.sendMessage(
          phoneNumberFormatter(number.number),
          data.text
        );
      }

      return {
        code: 201,
        message: "blasting wa successfully",
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
        message: "Error - WaInstanceService - blast: " + error.message,
        data: null,
      };
    }
  }

  /**
   * Delete WA Instance
   *
   * @param {string} wa_instance_id
   * @param {any} loginInfo
   *
   * @returns {Promise<{
   *    code: number,
   *    message: string,
   *    data: null
   * }>}
   */
  async delete(wa_instance_id, loginInfo) {
    try {
      // where clause
      let whereClause;
      if (loginInfo.UserLevel.name === "client") {
        whereClause = {
          wa_instance_id: wa_instance_id,
          user_id: loginInfo.user_id,
          deleted: 0,
        };
      } else if (loginInfo.UserLevel.name === "superadmin") {
        whereClause = {
          wa_instance_id: wa_instance_id,
          deleted: 0,
        };
      }

      let dtWaInstance = await WaInstance.findOne({
        where: whereClause,
      });

      if (!dtWaInstance) {
        return {
          code: 404,
          message: "wa instance not found",
          data: null,
        };
      } else {
        await WaInstance.update(
          {
            deleted: 1,
            deleted_by: loginInfo.user_id,
            deleted_at: new Date(),
          },
          {
            where: { wa_instance_id: wa_instance_id },
          }
        );
        this.getAll_revalidate(dtWaInstance.user_id, loginInfo);

        return {
          code: 200,
          message: "delete wa instance successfully",
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
        message: "Error - WaInstanceService - delete: " + error.message,
        data: null,
      };
    }
  }

  async wakeUpInstance(wa_instance_id, userId) {
    const io = getSocket();

    try {
      // Cek apakah instance sudah ada di memori
      if (global.instances && global.instances[wa_instance_id]) {
        console.log(`Instance ${wa_instance_id} sudah ada di memori.`);
        return;
      } else {
        console.log(`Instance ${wa_instance_id} sedang dibangunkan.`);
      }

      const clientFolder = path.join(__dirname, `../../.wwebjs_auth`);
      const client = new Client({
        clientId: wa_instance_id,
        restartOnAuthFail: true,
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process", // <- this one doesn't works in Windows
            "--disable-gpu",
            "--disable-software-rasterizer",
          ],
        },
        authStrategy: new LocalAuth({
          clientId: wa_instance_id,
          dataPath: clientFolder,
        }),
      });

      client.on("qr", async (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
          io.to(`room:${userId}`).emit(`instance:${wa_instance_id}`, {
            code: 200,
            message: "QR Code received, scan please!",
            data: {
              qr: url,
              status: "qr",
            },
          });
        });

        await WaInstance.update(
          {
            qr_code: qr,
            status: "qr",
            phone_number: null,
          },
          {
            where: { wa_instance_id: wa_instance_id },
          }
        );
      });

      client.on("ready", async () => {
        const phoneNumber = client.info.wid.user;

        io.to(`room:${userId}`).emit(`instance:${wa_instance_id}`, {
          code: 200,
          message: "Instance is ready!",
          data: {
            qr: null,
            status: "ready",
            phone_number: phoneNumber,
          },
        });

        await WaInstance.update(
          {
            phone_number: phoneNumber,
            qr_code: "",
            status: "ready",
          },
          {
            where: { wa_instance_id: wa_instance_id },
          }
        );
      });

      client.on("authenticated", async () => {
        io.to(`room:${userId}`).emit(`instance:${wa_instance_id}`, {
          code: 200,
          message: "Instance is authenticated!",
          data: {
            qr: null,
            status: "authenticated",
            phone_number: null,
          },
        });

        await WaInstance.update(
          {
            qr_code: "",
            status: "authenticated",
          },
          {
            where: { wa_instance_id: wa_instance_id },
          }
        );
      });

      client.on("auth_failure", async (session) => {
        io.to(`room:${userId}`).emit(`instance:${wa_instance_id}`, {
          code: 200,
          message: "Instance failure, restarting...",
          data: {
            qr: null,
            status: "auth_failure",
            phone_number: null,
          },
        });

        await WaInstance.update(
          {
            qr_code: "",
            status: "auth_failure",
          },
          {
            where: { wa_instance_id: wa_instance_id },
          }
        );
      });
      client.initialize();

      client.on("disconnected", async (reason) => {
        io.to(`room:${userId}`).emit(`instance:${wa_instance_id}`, {
          code: 200,
          message: "Instance is disconnected!",
          data: {
            qr: null,
            status: "disconnected",
            phone_number: null,
          },
        });

        await WaInstance.update(
          {
            phone_number: "",
            qr_code: "",
            status: "disconnected",
          },
          {
            where: { wa_instance_id: wa_instance_id },
          }
        );
        client.destroy();
        client.initialize();

        delete global.instances[wa_instance_id];
      });

      global.instances = global.instances || {};
      global.instances[wa_instance_id] = client;
    } catch (error) {
      io.to(`room:${userId}`).emit(`instance:${wa_instance_id}`, {
        code: 500,
        message: "Error - WaInstanceService - wakeUpInstance: " + error.message,
        data: null,
      });
      console.log(`Instance ${wa_instance_id} bermasalah: `, error.message);
    }
  }
}

module.exports = new WaInstanceService();
