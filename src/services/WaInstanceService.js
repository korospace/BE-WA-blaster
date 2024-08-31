// LOAD LIBS
const { ValidationError } = require("sequelize");
const { Client, LocalAuth, RemoteAuth } = require("whatsapp-web.js");
// const { MongoStore } = require("wwebjs-mongo");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");

// MODELS
const { User, WaInstance, WaNumber } = require("../models");

// SERVICES
const emailService = require("./EmailService");

// HELPERS
const {
  generateWAInstanceId,
  phoneNumberFormatter,
} = require("../helpers/utils");

// SOCKET
const { getSocket } = require("../pkg/socket/socket");

// MONGO-DB
// const mongoose = require("../pkg/mongodb/mongo");

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
        if (userId) {
          includeOption = [];
          whereClause = { deleted: 0, user_id: userId };
        } else {
          includeOption = [];
          whereClause = { deleted: 0 };
        }
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
        this.wakeUpInstance(row.wa_instance_id, row.user_id);
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
      this.saveWaInstanceDisconnectToFile(wa_instance_id, userId);

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
   * Logout WA Instance
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
  async logout(wa_instance_id, loginInfo) {
    const io = getSocket();

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
            phone_number: "",
            status: "disconnected",
            updated_by: loginInfo.user_id,
            updated_at: new Date(),
          },
          {
            where: { wa_instance_id: wa_instance_id },
          }
        );
        if (global.instances && global.instances[wa_instance_id]) {
          await global.instances[wa_instance_id].logout();
          delete global.instances[wa_instance_id];
        }
        this.removeWaInstanceReadyFromFile(
          wa_instance_id,
          dtWaInstance.user_id
        );
        this.saveWaInstanceDisconnectToFile(
          wa_instance_id,
          dtWaInstance.user_id
        );
        io.to(`room:${dtWaInstance.user_id}`).emit(
          `instance:${wa_instance_id}`,
          {
            code: 200,
            message: "Instance is disconnected!",
            data: {
              qr: null,
              status: "disconnected",
              phone_number: null,
            },
          }
        );

        return {
          code: 200,
          message: "logout wa instance successfully",
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
        message: "Error - WaInstanceService - logout: " + error.message,
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
        await this.logout(wa_instance_id, loginInfo);
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
        if (global.instances && global.instances[wa_instance_id]) {
          delete global.instances[wa_instance_id];
        }
        this.removeWaInstanceDisconnectFromFile(
          wa_instance_id,
          dtWaInstance.user_id
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

  /**
   * Wakup WA Instance
   *
   * @param {string} wa_instance_id
   * @param {string} userId
   *
   * @returns {void}
   */
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

      // Auth Folder
      const authFolder = path.join(__dirname, `../../.wwebjs_auth`);

      // Auth DB
      // const store = new MongoStore({ mongoose });

      const client = new Client({
        clientId: wa_instance_id,
        restartOnAuthFail: true,
        puppeteer: {
          headless: true,
          timeout: 60000,
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
          dataPath: authFolder,
        }),
        // authStrategy: new RemoteAuth({
        //   clientId: wa_instance_id,
        //   backupSyncIntervalMs: 60000,
        //   store,
        // }),
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

        this.removeWaInstanceReadyFromFile(wa_instance_id, userId);
        this.saveWaInstanceDisconnectToFile(wa_instance_id, userId);
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

        this.saveWaInstanceReadyToFile(wa_instance_id, userId);
        this.removeWaInstanceDisconnectFromFile(wa_instance_id, userId);
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

        this.saveWaInstanceReadyToFile(wa_instance_id, userId);
        this.removeWaInstanceDisconnectFromFile(wa_instance_id, userId);
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

        this.removeWaInstanceReadyFromFile(wa_instance_id, userId);
        this.saveWaInstanceDisconnectToFile(wa_instance_id, userId);
      });

      client.on("disconnected", async (reason) => {
        this.removeWaInstanceReadyFromFile(wa_instance_id, userId);
        this.saveWaInstanceDisconnectToFile(wa_instance_id, userId);
        await this.notifInstanceDisconect(wa_instance_id, reason);

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

        delete global.instances[wa_instance_id];
        client.initialize();
      });

      client.initialize();
      global.instances = global.instances || {};
      global.instances[wa_instance_id] = client;
      return;
    } catch (error) {
      io.to(`room:${userId}`).emit(`instance:${wa_instance_id}`, {
        code: 500,
        message: "Error - WaInstanceService - wakeUpInstance: " + error.message,
        data: null,
      });
      console.log(`Instance ${wa_instance_id} bermasalah: `, error.message);
      return;
    }
  }

  /**
   * Save WA Instance READY to JSON
   *
   * @param {string} wa_instance_id
   * @param {string} userId
   *
   * @returns {void}
   */
  async saveWaInstanceReadyToFile(wa_instance_id, userId) {
    const filePath = path.join(
      __dirname,
      "../generated/wa_instance_ready.json"
    );

    // Baca file JSON yang ada (jika ada)
    let waInstanceIds = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      waInstanceIds = JSON.parse(data);
    }

    // Tambahkan wa_instance_id baru ke array
    const isExist = waInstanceIds.some(
      (instance) => instance.wa_instance_id === wa_instance_id
    );
    if (!isExist) {
      waInstanceIds.push({
        wa_instance_id: wa_instance_id,
        user_id: userId,
      });
    }

    // Tulis array ke file JSON
    fs.writeFileSync(filePath, JSON.stringify(waInstanceIds, null, 2));
    return;
  }

  /**
   * Remove WA Instance READY from JSON
   *
   * @param {string} wa_instance_id
   * @param {string} userId
   *
   * @returns {void}
   */
  async removeWaInstanceReadyFromFile(wa_instance_id, userId) {
    const filePath = path.join(
      __dirname,
      "../generated/wa_instance_ready.json"
    );

    // Baca file JSON yang ada (jika ada)
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      let waInstanceIds = JSON.parse(data);

      // Hapus wa_instance_id dari array
      waInstanceIds = waInstanceIds.filter(
        (row) => row.wa_instance_id !== wa_instance_id
      );

      // Tulis array yang sudah diperbarui ke file JSON
      fs.writeFileSync(filePath, JSON.stringify(waInstanceIds, null, 2));
    }

    return;
  }

  /**
   * Save WA Instance DISCONNECT to JSON
   *
   * @param {string} wa_instance_id
   * @param {string} userId
   *
   * @returns {void}
   */
  async saveWaInstanceDisconnectToFile(wa_instance_id, userId) {
    const filePath = path.join(
      __dirname,
      "../generated/wa_instance_disconnect.json"
    );

    // Baca file JSON yang ada (jika ada)
    let waInstanceIds = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      waInstanceIds = JSON.parse(data);
    }

    // Tambahkan wa_instance_id baru ke array
    const isExist = waInstanceIds.some(
      (instance) => instance.wa_instance_id === wa_instance_id
    );
    if (!isExist) {
      waInstanceIds.push({
        wa_instance_id: wa_instance_id,
        user_id: userId,
      });
    }

    // Tulis array ke file JSON
    fs.writeFileSync(filePath, JSON.stringify(waInstanceIds, null, 2));
    return;
  }

  /**
   * Remove WA Instance DISCONNECT from JSON
   *
   * @param {string} wa_instance_id
   * @param {string} userId
   *
   * @returns {void}
   */
  async removeWaInstanceDisconnectFromFile(wa_instance_id, userId) {
    const filePath = path.join(
      __dirname,
      "../generated/wa_instance_disconnect.json"
    );

    // Baca file JSON yang ada (jika ada)
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      let waInstanceIds = JSON.parse(data);

      // Hapus wa_instance_id dari array
      waInstanceIds = waInstanceIds.filter(
        (row) => row.wa_instance_id !== wa_instance_id
      );

      // Tulis array yang sudah diperbarui ke file JSON
      fs.writeFileSync(filePath, JSON.stringify(waInstanceIds, null, 2));
    }

    return;
  }

  async notifInstanceDisconect(wa_instance_id, reason) {
    try {
      // get instance data
      const dt = await WaInstance.findOne({
        attributes: ["wa_instance_id", "user_id", "phone_number"],
        where: { wa_instance_id: wa_instance_id },
        include: [
          {
            model: User,
            attributes: ["user_id", "email"],
            as: "user",
          },
        ],
      });

      // update
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

      // send email
      const subject = "Instance Disconnect";
      const text = "Instance Disconnect";
      const html = `<h1>${wa_instance_id}</h1><h2>${dt.user.email}</h2><p>Disconnect with reason: ${reason}!</p>`;

      await emailService.sendMail(dt.user.email, subject, text, html);
    } catch (error) {
      console.log(
        "Error - WaInstanceService - notifInstanceDisconect: ",
        error.message
      );
    }
  }
}

module.exports = new WaInstanceService();
