// commands/autoseen.js
const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, 'autoseen');
const pathFile = path.join(dataDir, 'autoseen.txt');

module.exports = {
  config: {
    name: "autoseen",
    version: "1.1.1",
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

  // Ensure state file exists and return trimmed lowercase value
  _loadState() {
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirpSync(dataDir);
      if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, "false", "utf8");
      return fs.readFileSync(pathFile, "utf8").toString().trim().toLowerCase();
    } catch (err) {
      console.error("autoseen _loadState error:", err);
      return "false";
    }
  },

  // Save state (expects "true" or "false")
  _saveState(value = "false") {
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirpSync(dataDir);
      fs.writeFileSync(pathFile, value, "utf8");
    } catch (err) {
      console.error("autoseen _saveState error:", err);
    }
  },

  // handleEvent should work with common loader signatures
  handleEvent: async function (context = {}) {
    try {
      // normalize parameters: accept either { api, event } or { nayan, events } etc.
      const api = context.api || context.shourov || context.shourov || (global && global.shourov) || null;
      const event = context.event || context.events || context || {};

      if (!api || !event) return;

      const state = this._loadState();
      if (state !== "true") return;

      // mark all as read if API supports it
      try {
        if (typeof api.markAsReadAll === "function") {
          api.markAsReadAll(() => {});
        } else if (typeof api.markAsRead === "function") {
          // some forks implement markAsRead(threadID)
          try { api.markAsRead(event.threadID); } catch (e) {}
        } else {
          console.warn("autoseen: api does not support markAsReadAll/markAsRead.");
        }
      } catch (err) {
        console.error("autoseen: error while marking read:", err && (err.stack || err));
      }
    } catch (err) {
      console.error("autoseen.handleEvent error:", err && (err.stack || err));
    }
  },

  // run - command handler (toggle)
  run: async function (context = {}) {
    try {
      const api = context.api || context.shourov || context.shourov || (global && global.shourov) || null;
      const event = context.event || context.events || context || {};
      const args = context.args || [];

      const reply = (msg) => {
        try {
          if (api && typeof api.sendMessage === "function") return api.sendMessage(msg, event.threadID, event.messageID);
          if (api && typeof api.reply === "function") return api.reply(msg, event.threadID, event.messageID);
          // fallback: console
          console.log("autoseen reply:", msg);
        } catch (e) {
          console.error("autoseen.run reply error:", e);
        }
      };

      const sub = (args[0] || "").toString().toLowerCase();
      if (sub === "on") {
        this._saveState("true");
        return reply(this.languages.en.on);
      } else if (sub === "off") {
        this._saveState("false");
        return reply(this.languages.en.off);
      } else {
        return reply(this.languages.en.error);
      }
    } catch (err) {
      console.error("autoseen.run error:", err && (err.stack || err));
    }
  },

  // start compatibility (some loaders call start)
  start: async function (context = {}) {
    return this.run(context);
  }
};
