const fs = require('fs-extra');
const path = require('path');

const dir = path.join(__dirname, 'autoreact');
const pathFile = path.join(dir, 'autoreact.txt');

module.exports = {
  config: {
    name: "autoreact",
    version: "1.0.1",
    permission: 0,
    credits: "shourov",
    description: "",
    prefix: "awto",
    category: "auto",
    usages: "[on]/[off]",
    cooldowns: 5
  },

  languages: {
    "en": {
      "off": "the autoreact function has been disabled for new messages.",
      "on": "the autoreact function is now enabled for new messages.",
      "error": "incorrect syntax"
    }
  },

  // Ensure folder + file exist
  onLoad: async () => {
    await fs.ensureDir(dir);
    if (!fs.existsSync(pathFile)) {
      await fs.writeFile(pathFile, "false", "utf8");
    }
  },

  // AUTO REACT SYSTEM
  handleEvent: async ({ api, event }) => {
    try {
      if (!fs.existsSync(pathFile)) return;

      const state = (await fs.readFile(pathFile, "utf8")).trim();
      if (state !== "true") return;

      if (!event.messageID) return;

      const reactions = [
        "💀","🙄","🤭","🥺","😶","😝","👿","🤓","🥶","🗿","😾",
        "🤪","🤬","🤫","😼","😶‍🌫️","😎","🤦","💅","👀","☠️","🧠",
        "👺","🤡","🤒","🤧","😫","😇","🥳","😭"
      ];

      const react = reactions[Math.floor(Math.random() * reactions.length)];

      api.setMessageReaction(react, event.messageID, () => {}, true);
    } catch (err) {
      console.error("autoreact error:", err);
    }
  },

  // EXACT SAME STRUCTURE YOU WANT
  start: async ({ shourov, events, args, lang }) => {
    try {
      const logger = require("../../shourovbot/alihsan/shourovc.js");

      if (!args[0]) {
        return nayan.sendMessage(lang("error"), events.threadID, events.messageID);
      }

      if (args[0] === "on") {
        fs.writeFileSync(pathFile, "true");
        return shourov.sendMessage(lang("on"), events.threadID, events.messageID);
      }

      if (args[0] === "off") {
        fs.writeFileSync(pathFile, "false");
        return shourov.sendMessage(lang("off"), events.threadID, events.messageID);
      }

      return nayan.sendMessage(lang("error"), events.threadID, events.messageID);

    } catch (e) {
      console.error("Unexpected error:", e);
    }
  }
};