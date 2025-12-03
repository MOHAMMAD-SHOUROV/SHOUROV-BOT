// shourov/events/logs.js
module.exports.config = {
  name: "logs",
  eventType: ["log:unsubscribe", "log:subscribe", "log:thread-name"],
  version: "1.0.1",
  credits: "shourov",
  description: "record bot activity notifications",
  envConfig: {
    enable: true
  }
};

module.exports.run = async function ({ api, event, Threads }) {
  try {
    // logger (optional) — adjust path if needed
    let logger = null;
    try { logger = require("../../shourovbot/alihsan/shourovc.js"); } catch (e) { logger = null; }

    // respect global config toggle (safe)
    try {
      if (!global.configModule || !global.configModule[this.config.name] || !global.configModule[this.config.name].enable) return;
    } catch (e) {
      // if config not available, continue but do nothing
      return;
    }

    if (!event || !event.logMessageType) return;

    // prepare basic report
    let formReport = "bot notification" +
      "\n\nthread id : " + (event.threadID || "unknown") +
      "\naction : {task}" +
      "\nuser id : " + (event.author || "unknown") +
      "\ndate : " + new Date().toISOString();

    let task = "";

    switch (event.logMessageType) {
      case "log:thread-name": {
        // get old name safely and store new name
        let oldName = "name does not exist";
        try {
          const tdata = await Threads.getData(event.threadID).catch(()=>null);
          if (tdata && (tdata.name || (tdata.data && tdata.data.name))) {
            oldName = tdata.name || tdata.data.name;
          }
        } catch (e) { /* ignore */ }

        const newName = (event.logMessageData && event.logMessageData.name) ? event.logMessageData.name : "name does not exist";
        task = `user changes group name from : '${oldName}' to '${newName}'`;

        // persist new name (best-effort)
        try { await Threads.setData(event.threadID, { name: newName }); } catch (e) { /* ignore */ }
        break;
      }

      case "log:subscribe": {
        try {
          if (event.logMessageData && Array.isArray(event.logMessageData.addedParticipants) &&
              event.logMessageData.addedParticipants.some(i => String(i.userFbId) === String(api.getCurrentUserID()))) {
            task = "the user added the bot to a new group";
          }
        } catch (e) { /* ignore */ }
        break;
      }

      case "log:unsubscribe": {
        try {
          if (event.logMessageData && String(event.logMessageData.leftParticipantFbId) === String(api.getCurrentUserID())) {
            task = "the user kicked the bot out of the group";
          }
        } catch (e) { /* ignore */ }
        break;
      }

      default:
        break;
    }

    if (!task) return;

    formReport = formReport.replace(/\{task\}/g, task);

    // send report to ADMINBOT(s) — validate existence
    const admins = (global.config && Array.isArray(global.config.ADMINBOT) && global.config.ADMINBOT.length) ? global.config.ADMINBOT : (global.config && global.config.ADMINBOT ? [global.config.ADMINBOT] : []);
    if (!admins || admins.length === 0) {
      if (logger) try { logger("logs", "No ADMINBOT configured"); } catch(e){ }
      return;
    }

    const toId = String(admins[0]); // send to first admin by default
    try {
      return api.sendMessage(formReport, toId, (error, info) => {
        if (error && logger) try { logger("logs", `failed to send report: ${error.message || error}`); } catch(e){}
      });
    } catch (err) {
      if (logger) try { logger("logs", `exception sending report: ${err.message || err}`); } catch(e){}
      return;
    }

  } catch (err) {
    console.error("logs event error:", err && (err.stack || err));
  }
};
