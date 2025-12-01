// commands/autoseen.js
const fs = require('fs-extra');
const path = require('path');

// Ensure directory exists
const dataDir = path.join(__dirname, 'autoseen');
const pathFile = path.join(dataDir, 'autoseen.txt');

module.exports = {
  config: {
    name: "autoseen",
    version: "1.1.0",
    permission: 2,
    credits: "shourov (fixed)",
    description: "Automatically mark all messages as seen (on/off)",
    prefix: true,
    category: "system",
    usages: "autoseen on | autoseen off",
    cooldowns: 5
  },

  languages: {
    en: {
      on: "✅ Autoseen enabled. All incoming messages will now be marked as seen.",
      off: "❌ Autoseen disabled. Messages will no longer be auto-seen.",
      error: "⚠️ Incorrect syntax. Use: autoseen on | autoseen off"
    }
  },

  /** Load autoseen state */
  _loadState() {
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirpSync(dataDir);
      if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, "false", "utf8");
      return fs.readFileSync(pathFile, "utf8").trim().toLowerCase();
    } catch (err) {
      console.error("autoseen loadState error:", err);
      return "false";
    }
  },

  /** Save state */
  _saveState(value) {
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirpSync(dataDir);
      fs.writeFileSync(pathFile, value, "utf8");
    } catch (err) {
      console.error("autoseen saveState error:", err);
    }
  },

  /** Auto Seen Handler */
  handleEvent: async function ({ api, event }) {
    try {
      const state = this._loadState();
      if (state === "true") {
        api.markAsReadAll(() => {});
      }
    } catch (err) {
      console.error("autoseen.handleEvent error:", err);
    }
  },

  /** Command */
  run: async function ({ api, event, args }) {
    const state = (args[0] || "").toLowerCase();
    const reply = (msg) => api.sendMessage(msg, event.threadID, event.messageID);

    if (state === "on") {
      this._saveState("true");
      return reply(this.languages.en.on);
    }

    else if (state === "off") {
      this._saveState("false");
      return reply(this.languages.en.off);
    }

    return reply(this.languages.en.error);
  }
};
