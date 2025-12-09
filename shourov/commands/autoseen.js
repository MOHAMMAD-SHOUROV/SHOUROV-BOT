const fs = require('fs-extra');

const dirPath = __dirname + '/autoseen';
const pathFile = dirPath + '/autoseen.txt';

module.exports.config = {
  name: "autoseen",
  version: "1.0.0",
  permission: 2,
  credits: "shourov",
  description: "turn on/off auto read messages",
  prefix: true,
  category: "system",
  usages: "on/off",
  cooldowns: 5,
};

// AUTO CREATE FOLDER & FILE
if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, "false");

module.exports.handleEvent = async ({ api, event }) => {
  try {
    const status = fs.readFileSync(pathFile, "utf-8");

    if (status === "true") {
      api.markAsReadAll(() => {});
    }

  } catch (e) {
    console.log("[AutoSeen Error] " + e);
  }
};

module.exports.run = async ({ api, event, args }) => {

  try {
    const logger = global.utils.logger || console.log;

    if (!args[0])
      return api.sendMessage("❗ Use: autoseen on/off", event.threadID, event.messageID);

    if (args[0].toLowerCase() === "on") {
      fs.writeFileSync(pathFile, "true");
      return api.sendMessage("✅ AutoSeen enabled successfully.", event.threadID, event.messageID);
    }

    else if (args[0].toLowerCase() === "off") {
      fs.writeFileSync(pathFile, "false");
      return api.sendMessage("❌ AutoSeen disabled successfully.", event.threadID, event.messageID);
    }

    else {
      return api.sendMessage("⚠️ Wrong usage! Use: autoseen on/off", event.threadID, event.messageID);
    }

  } catch (err) {
    console.log(err);
    api.sendMessage("⚠️ Unexpected error occurred!", event.threadID, event.messageID);
  }
};