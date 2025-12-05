const fs = require('fs-extra');
const path = require('path');

const dir = path.join(__dirname, 'autoseen');
const pathFile = path.join(dir, 'autoseen.txt');

module.exports = {
  config: {
    name: "autoseen",
    version: "1.0.1",
    permission: 0,
    credits: "shourov",
    description: "Turn on/off auto seen",
    prefix: "seen",
    category: "auto",
    usages: "[on]/[off]",
    cooldowns: 5
  },

  languages: {
    "en": {
      "off": "the autoseen function has been disabled for new messages.",
      "on": "the autoseen function is now enabled for new messages.",
      "error": "incorrect syntax"
    }
  },

  // Create folder + file if missing
  onLoad: async () => {
    await fs.ensureDir(dir);
    if (!fs.existsSync(pathFile)) {
      await fs.writeFile(pathFile, 'false');
    }
  },

  // AUTO-SEEN SYSTEM
  handleEvent: async ({ api, event }) => {
    try {
      if (!fs.existsSync(pathFile)) return;

      const state = (await fs.readFile(pathFile, 'utf-8')).trim();
      if (state !== 'true') return;

      api.markAsReadAll(() => {});
      
    } catch (err) {
      console.error("AutoSeen Error:", err);
    }
  },

  // EXACT SAME STRUCTURE YOU WANTED
  start: async ({ shourov, events, args, lang }) => {
    try {
      const logger = require("../../shourovbot/alihsan/shourovc.js");

      if (!args[0]) {
        return nayan.sendMessage(lang("error"), events.threadID, events.messageID);
      }

      if (args[0] === "on") {
        fs.writeFileSync(pathFile, 'true');
        return shourov.sendMessage(lang("on"), events.threadID, events.messageID);
      }

      if (args[0] === "off") {
        fs.writeFileSync(pathFile, 'false');
        return shourov.sendMessage(lang("off"), events.threadID, events.messageID);
      }

      return nayan.sendMessage(lang("error"), events.threadID, events.messageID);

    } catch (e) {
      console.error("Unexpected AutoSeen Error:", e);
    }
  }
};