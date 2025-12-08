module.exports.config = {
  name: "rankup",
  version: "1.0.2",
  permission: 0,
  credits: "(fixed by shourov)",
  description: "Rank up notification (level up)",
  prefix: true,
  category: "system",
  usages: "system",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

module.exports.handleEvent = async function({ api, event, Currencies, Users, getText }) {
  try {
    let { threadID, senderID } = event;
    threadID = String(threadID);
    senderID = String(senderID);

    // safe access to fs-extra & path
    const fs = global.nodemodule && global.nodemodule["fs-extra"] ? global.nodemodule["fs-extra"] : require("fs-extra");
    const path = require("path");
    const { createReadStream, existsSync, mkdirSync } = fs;

    // get thread data from global storage if present
    const threadDataMap = (global.data && global.data.threadData) ? global.data.threadData : null;
    const thread = threadDataMap && threadDataMap.get(threadID) ? threadDataMap.get(threadID) : {};

    // get user exp safely
    let userData = {};
    try {
      if (Currencies && typeof Currencies.getData === "function") {
        userData = (await Currencies.getData(senderID)) || {};
      } else {
        userData = {};
      }
    } catch (e) {
      userData = {};
      console.warn("[rankup] Currencies.getData failed:", e && e.message ? e.message : e);
    }

    let exp = parseInt(userData.exp) || 0;
    exp += 1; // increment exp for this event (per original behavior)

    if (isNaN(exp)) {
      return;
    }

    // if thread has disabled rankup -> just persist exp and return
    if (typeof thread["rankup"] !== "undefined" && !thread["rankup"]) {
      try {
        if (Currencies && typeof Currencies.setData === "function") await Currencies.setData(senderID, { exp });
      } catch (e) {
        console.warn("[rankup] persist exp failed:", e && e.message ? e.message : e);
      }
      return;
    }

    // level formula (kept as original)
    const curLevel = Math.floor((Math.sqrt(1 + (4 * (exp - 1) / 3)) - 1) / 2); // previous level (using exp-1)
    const level = Math.floor((Math.sqrt(1 + (4 * exp / 3)) - 1) / 2); // new level

    // only notify when level increased and level !== 1 (preserve original condition)
    if (level > curLevel && level !== 1) {
      // resolve name safely
      let name = senderID;
      try {
        if (global.data && global.data.userName && global.data.userName.get(senderID)) {
          name = global.data.userName.get(senderID);
        } else if (Users && typeof Users.getNameUser === "function") {
          name = await Users.getNameUser(senderID);
        }
      } catch (e) {
        console.warn("[rankup] get name failed:", e && e.message ? e.message : e);
      }

      // message template (thread.customRankup overrides)
      let messageTemplate = (typeof thread.customRankup === "undefined")
        ? (typeof getText === "function" ? getText("levelup") : "Congrats {name}, you reached level {level}")
        : thread.customRankup;

      const message = messageTemplate
        .replace(/\{name\}/g, name)
        .replace(/\{level\}/g, level);

      // prepare optional gif attachment if present
      const assetsDir = path.join(__dirname, "shourov");
      if (!existsSync(assetsDir)) {
        try { mkdirSync(assetsDir, { recursive: true }); } catch (e) { /* ignore */ }
      }

      const gifPath = path.join(assetsDir, "flamingtext_com-2724546145.gif");

      const mentions = [{ tag: name, id: senderID }];
      const sendPayload = existsSync(gifPath)
        ? { body: message, attachment: createReadStream(gifPath), mentions }
        : { body: message, mentions };

      // check config module for autoUnsend
      const moduleName = this.config && this.config.name ? this.config.name : "rankup";
      const cfgModule = (global.configModule && global.configModule[moduleName]) ? global.configModule[moduleName] : {};
      const autoUnsend = !!cfgModule.autoUnsend;
      const unsendAfter = parseInt(cfgModule.unsendMessageAfter) || 10; // seconds

      // send message
      api.sendMessage(sendPayload, threadID, async (err, info) => {
        if (err) {
          console.error("[rankup] sendMessage error:", err && (err.stack || err));
          return;
        }
        // attempt auto unsend if enabled
        if (autoUnsend && info && info.messageID && typeof api.unsendMessage === "function") {
          try {
            await new Promise(r => setTimeout(r, unsendAfter * 1000));
            await api.unsendMessage(info.messageID);
          } catch (e) {
            console.warn("[rankup] auto-unsend failed:", e && e.message ? e.message : e);
          }
        }
      });
    }

    // persist updated exp
    try {
      if (Currencies && typeof Currencies.setData === "function") {
        await Currencies.setData(senderID, { exp });
      }
    } catch (e) {
      console.warn("[rankup] persist exp failed:", e && e.message ? e.message : e);
    }

  } catch (err) {
    console.error("[rankup] handleEvent error:", err && (err.stack || err));
  }
};

module.exports.languages = {
  "vi": {
    "off": "𝗧𝗮̆́𝘁",
    "on": "𝗕𝗮̣̂𝘁",
    "successText": "𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐭𝐡𝐨̂𝐧𝐠 𝐛𝐚́𝐨 𝐫𝐚𝐧𝐤𝐮𝐩 ✨",
    "levelup": "🌸 𝗞𝗶̃ 𝗻𝗮̆𝗻𝗴 𝘅𝗮̣𝗼 𝗹𝗼̂̀𝗻𝗻 𝗼̛̉ 𝗺𝗼̂𝗻 𝗽𝗵𝗮́𝗽 𝗵𝗮̂́𝗽 𝗱𝗶𝗲̂𝗺 𝗰𝘂̉𝗮 {name} 𝘃𝘂̛̀𝗮 𝗹𝗲̂𝗻 𝘁𝗼̛́𝗶 𝗹𝗲𝘃𝗲𝗹 {level} 🌸"
  },
  "en": {
    "on": "on",
    "off": "off",
    "successText": "success notification rankup!",
    "levelup": "আসসালামু আলাইকুম {name}, আপনার চ্যাটিং লেভেল {level} 🤷‍♂️"
  }
};

module.exports.run = async function({ api, event, Threads, getText }) {
  try {
    const { threadID, messageID } = event;
    const threadData = (await Threads.getData(threadID)).data || {};

    // toggle
    threadData["rankup"] = !(threadData["rankup"]);

    await Threads.setData(threadID, { data: threadData });
    if (global.data && global.data.threadData) global.data.threadData.set(threadID, threadData);

    return api.sendMessage(`${threadData["rankup"] ? getText("on") : getText("off")} ${getText("successText")}`, threadID, messageID);
  } catch (e) {
    console.error("[rankup] run error:", e && (e.stack || e));
    try { return api.sendMessage("An error occurred when toggling rankup.", event.threadID); } catch (err) {}
  }
};