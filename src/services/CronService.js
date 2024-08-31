// LOAD LIBS
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

// SERVICES
const WaInstanceService = require("./WaInstanceService");

// MODELS
const { User, WaInstance } = require("../models");
const wa_instance = require("../models/wa_instance");

/**
 * Check WA Instance is READY
 *
 * @returns {void}
 */
const checkUpWaInstanceReady = async () => {
  console.log("CRON - checkUpWaInstanceReady");
  const filePath = path.join(__dirname, "../generated/wa_instance_ready.json");

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    let waInstanceIds = JSON.parse(data);

    for (const row of waInstanceIds) {
      if (global.instances && global.instances[row.wa_instance_id]) {
        console.log(`Instance ${row.wa_instance_id} exists in memory`);

        try {
          const state = await global.instances[row.wa_instance_id].getState();
          console.log(`Instance ${row.wa_instance_id} state: ${state}`);

          if (state !== "CONNECTED") {
            console.log(`Instance ${row.wa_instance_id} is not connected`);

            // remove from ready file
            WaInstanceService.removeWaInstanceReadyFromFile(
              row.wa_instance_id,
              row.user_id
            );

            // send notif
            await WaInstanceService.notifInstanceDisconect(
              wa_instance,
              "no reason"
            );
          }
        } catch (error) {
          console.log(
            `Failed to get state for instance ${row.wa_instance_id}: ${error.message}`
          );

          // remove from ready file
          WaInstanceService.removeWaInstanceReadyFromFile(
            row.wa_instance_id,
            row.user_id
          );

          // send notif
          await WaInstanceService.notifInstanceDisconect(
            wa_instance,
            "ERROR - " + error.message
          );
        }
      } else {
        console.log(`Instance ${row.wa_instance_id} not exists in memory`);

        WaInstanceService.wakeUpInstance(row.wa_instance_id, row.user_id);
      }
    }
  }
};
cron.schedule("*/5 * * * * *", checkUpWaInstanceReady);

/**
 * Check WA Instance is ACTIVE
 *
 * @returns {void}
 */
const checkUpWaInstanceActive = async () => {
  console.log("CRON - checkUpWaInstanceActive");
  const filePath = path.join(__dirname, "../generated/wa_instance_active.json");

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    let waInstanceIds = JSON.parse(data);

    for (const row of waInstanceIds) {
      if (global.instances && global.instances[row.wa_instance_id]) {
        console.log(`Instance ${row.wa_instance_id} exists in memory`);
      } else {
        console.log(`Instance ${row.wa_instance_id} not exists in memory`);
        WaInstanceService.wakeUpInstance(row.wa_instance_id, row.user_id);
      }
    }
  }
};
cron.schedule("*/5 * * * * *", checkUpWaInstanceActive);

module.exports = cron;
