// commands/autoreact.js
const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, 'autoreact');
const pathFile = path.join(dataDir, 'autoreact.txt');

module.exports = {
  config: {
    name: "autoreact",
    version: "1.1.1",
    permission: 0,
    credits: "shourov (fixed)",
    description: "Automatically react to new messages (on/off)",
    prefix: true,
    category: "auto",
    usages: "[on|off]",
    cooldowns: 5,
    dependencies: {
      "fs-extra": ""
    }
  },

  languages: {
    vi: {},
    en: {
      off: '✅ Autoreact has been disabled for new messages.',
      on: '✅ Autoreact is now enabled for new messages.',
      error: '❗ Incorrect syntax. Use: autoreact on | autoreact off'
    }
  },

  _getText(key, providedGetText) {
    try {
      if (typeof providedGetText === 'function') return providedGetText(key);
    } catch (e) {}
    const langs = this.languages;
    return (langs && langs.en && langs.en[key]) ? langs.en[key] : '';
  },

  // handleEvent: called on incoming messages by most loaders
  handleEvent: async function (context = {}) {
    try {
      // normalize common param names so this module works with different loaders
      const api = context.api || context.shourov || context.shourov || (global && global.shourov) || null;
      const event = context.event || context.events || context.message || {};
      if (!api || !event || !event.messageID) return;

      // ensure folder & file exist
      if (!fs.existsSync(dataDir)) fs.mkdirpSync(dataDir);
      if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, 'false', 'utf8');

      const isEnableRaw = fs.readFileSync(pathFile, 'utf8').toString().trim().toLowerCase();
      if (isEnableRaw !== 'true') return;

      // avoid reacting to bot's own messages (best-effort)
      let botId;
      try {
        if (typeof api.getCurrentUserID === 'function') botId = api.getCurrentUserID();
        else if (api.getCurrentUserID) botId = api.getCurrentUserID;
      } catch (e) { /* ignore */ }
      if (botId && String(event.senderID) === String(botId)) return;

      // choose random reaction
      const reactions = [
        "💀","🙄","🤭","🥺","😶","😝","👿","🤓","🥶","🗿","😾","🤪",
        "🤬","🤫","😼","😶‍🌫️","😎","🤦","💅","👀","☠️","🧠","👺",
        "🤡","🤒","🤧","😫","😇","🥳","😭","❤️","✨","🌙"
      ];
      const react = reactions[Math.floor(Math.random() * reactions.length)];

      // set message reaction (different api versions have different signatures)
      try {
        if (typeof api.setMessageReaction === "function") {
          // some implementations accept (reaction, messageID, cb, force)
          try {
            api.setMessageReaction(react, event.messageID, (err) => {
              if (err) console.warn("autoreact: reaction error:", err && err.message ? err.message : err);
            }, true);
          } catch (e) {
            // fallback to simpler call
            try { api.setMessageReaction(react, event.messageID); } catch (er) { /* ignore */ }
          }
        } else if (typeof api.setReaction === "function") {
          // alternative naming
          try { api.setReaction && api.setReaction(react, event.messageID); } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.error("autoreact: failed to set reaction", err && (err.stack || err));
      }
    } catch (err) {
      console.error("autoreact.handleEvent error:", err && (err.stack || err));
    }
  },

  // command runner: toggle on/off
  run: async function (context = {}) {
    try {
      // normalize
      const api = context.api || context.shourov || context.shourov || (global && global.shourov) || null;
      const event = context.event || context.events || context;
      const args = (context.args || []).map(a => a.toString());
      const getText = context.getText || ((k) => this._getText(k));

      // ensure folder exists
      if (!fs.existsSync(dataDir)) fs.mkdirpSync(dataDir);
      if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, 'false', 'utf8');

      const sub = (args && args[0]) ? args[0].toString().toLowerCase() : "";
      const replyFunc = (txt) => {
        try {
          if (!api) return console.warn("autoreact.run: api not found");
          if (typeof api.sendMessage === 'function') return api.sendMessage(txt, event.threadID, event.messageID);
          if (typeof api.reply === 'function') return api.reply(txt, event.threadID, event.messageID);
        } catch (e) { console.error(e); }
      };

      if (sub === 'on') {
        fs.writeFileSync(pathFile, 'true', 'utf8');
        return replyFunc(getText('on'));
      } else if (sub === 'off') {
        fs.writeFileSync(pathFile, 'false', 'utf8');
        return replyFunc(getText('off'));
      } else {
        return replyFunc(getText('error'));
      }
    } catch (err) {
      console.error("autoreact.run error:", err && (err.stack || err));
      try {
        const api = context.api || context.shourov || context.shourov || (global && global.shourov) || null;
        if (api && typeof api.sendMessage === 'function') api.sendMessage("❗ Unexpected error while toggling autoreact.", context.threadID || context.event && context.event.threadID);
      } catch (e) {}
    }
  },

  // compatibility: some loaders call start()
  start: async function (context = {}) {
    // call run so both behaviors are supported
    return this.run(context);
  }
};

// expose module name for some loaders
module.exports.name = module.exports.config.name;
