module.exports.config = {
  name: "rankup",
  version: "1.0.1",
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
    var { threadID, senderID } = event;
    const { createReadStream, existsSync, mkdirSync } = global.nodemodule["fs-extra"];

    threadID = String(threadID);
    senderID = String(senderID);

    const thread = (global.data && global.data.threadData && global.data.threadData.get(threadID)) ? global.data.threadData.get(threadID) : {};

    // get exp safely
    let userData = {};
    try {
      userData = await Currencies.getData(senderID) || {};
    } catch (e) {
      userData = {};
    }
    let exp = parseInt(userData.exp) || 0;
    exp += 1;

    if (isNaN(exp)) return;

    // if thread has disabled rankup
    if (typeof thread["rankup"] !== "undefined" && !thread["rankup"]) {
      await Currencies.setData(senderID, { exp });
      return;
    }

    // level calculation
    const curLevel = Math.floor((Math.sqrt(1 + (4 * exp / 3)) - 1) / 2);
    const level = Math.floor((Math.sqrt(1 + (4 * (exp + 1) / 3)) - 1) / 2);

    if (level > curLevel && level !== 1) {
      const name = global.data.userName.get(senderID) || (Users && typeof Users.getNameUser === "function" ? await Users.getNameUser(senderID) : senderID);
      let message = (typeof thread.customRankup === "undefined") ? (typeof getText === "function" ? getText("levelup") : "Congrats {name}, you reached level {level}") : thread.customRankup;
      
      message = message
        .replace(/\{name\}/g, name)
        .replace(/\{level\}/g, level);

      // Ensure folder exists (create only if not exists)
      const dirPath = __dirname + "/shourov/";
      if (!existsSync(dirPath)) {
        try { mkdirSync(dirPath, { recursive: true }); } catch (e) { /* ignore */ }
      }

      const gifPath = __dirname + "/shourov/flamingtext_com-2724546145.gif";
      let arrayContent;

      if (existsSync(gifPath)) {
        arrayContent = { body: message, attachment: createReadStream(gifPath), mentions: [{ tag: name, id: senderID }] };
      } else {
        arrayContent = { body: message, mentions: [{ tag: name, id: senderID }] };
      }

      // Safe access for configModule and autoUnsend
      const moduleName = this.config.name;
      const cfgModule = (global.configModule && global.configModule[moduleName]) ? global.configModule[moduleName] : {};
      const autoUnsend = !!cfgModule.autoUnsend;
      const unsendAfter = parseInt(cfgModule.unsendMessageAfter) || 10; // default 10s if set

      api.sendMessage(arrayContent, threadID, async function (error, info) {
        if (error) {
          console.error(`[rankup] sendMessage error:`, error);
          return;
        }
        try {
          if (autoUnsend) {
            await new Promise(resolve => setTimeout(resolve, unsendAfter * 1000));
            if (info && info.messageID && typeof api.unsendMessage === "function") {
              await api.unsendMessage(info.messageID);
            }
          }
        } catch (e) {
          console.warn("[rankup] unsend error:", e && e.message ? e.message : e);
        }
      });
    }

    // persist exp
    try {
      await Currencies.setData(senderID, { exp });
    } catch (e) {
      console.warn("[rankup] failed to persist exp:", e && e.message ? e.message : e);
    }

    return;
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
    let data = (await Threads.getData(threadID)).data || {};
    
    if (typeof data["rankup"] === "undefined" || !data["rankup"]) {
      data["rankup"] = true;
    } else {
      data["rankup"] = false;
    }
    
    await Threads.setData(threadID, { data });
    global.data.threadData.set(threadID, data);
    return api.sendMessage(`${(data["rankup"]) ? getText("on") : getText("off")} ${getText("successText")}`, threadID, messageID);
  } catch (e) {
    console.error("[rankup] run error:", e && (e.stack || e));
    try { return api.sendMessage("An error occurred when toggling rankup.", event.threadID); } catch (err) {}
  }
};