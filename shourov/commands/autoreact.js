// commands/autoreact.js
const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, 'autoreact');
const pathFile = path.join(dataDir, 'autoreact.txt');

module.exports = {
  config: {
    name: "autoreact",
    version: "1.1.0",
    permission: 0,
    credits: "shourov (fixed)",
    description: "Automatically react to new messages (on/off)",
    prefix: true,
    category: "auto",
    usages: "[off]/[on]",
    cooldowns: 5,
    dependencies: {
      "request": "",
      "fs-extra": "",
      "axios": ""
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

  /**
   * helper to get language strings (falls back to en)
   * If your loader provides getText/getLang, prefer that instead.
   */
  _getText(key, providedGetText) {
    try {
      if (typeof providedGetText === 'function') return providedGetText(key);
    } catch (e) { }
    const langs = this.languages;
    // try english fallback
    return (langs && langs.en && langs.en[key]) ? langs.en[key] : '';
  },

  // event handler: reacts to incoming message if enabled
  handleEvent: async function ({ api, event, Threads }) {
    try {
      // ensure folder & file exist
      if (!fs.existsSync(dataDir)) fs.mkdirpSync(dataDir);
      if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, 'false', 'utf8');

      const isEnableRaw = fs.readFileSync(pathFile, 'utf8').toString().trim().toLowerCase();
      if (isEnableRaw !== 'true') return;

      // don't react to messages sent by the bot itself
      const botId = (typeof api.getCurrentUserID === 'function') ? api.getCurrentUserID() : null;
      if (String(event.senderID) === String(botId)) return;

      // choose random reaction
      const reactions = [
        "💀","🙄","🤭","🥺","😶","😝","👿","🤓","🥶","🗿","😾","🤪",
        "🤬","🤫","😼","😶‍🌫️","😎","🤦","💅","👀","☠️","🧠","👺",
        "🤡","🤒","🤧","😫","😇","🥳","😭","❤️","✨","🌙"
      ];
      const react = reactions[Math.floor(Math.random() * reactions.length)];

      // set message reaction (some API versions accept 4th param force boolean)
      if (typeof api.setMessageReaction === "function") {
        try {
          api.setMessageReaction(react, event.messageID, (err) => {
            if (err) console.warn("autoreact: reaction error:", err && err.message ? err.message : err);
          }, true);
        } catch (e) {
          // fallback: older/newer API signature
          try { api.setMessageReaction(react, event.messageID); } catch (er) { /* ignore */ }
        }
      }
    } catch (err) {
      console.error("autoreact.handleEvent error:", err && (err.stack || err));
    }
  },

  // command: toggle on/off (called when someone runs the command)
  run: async function ({ api, event, args, getText }) {
    try {
      // ensure folder exists
      if (!fs.existsSync(dataDir)) fs.mkdirpSync(dataDir);
      if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, 'false', 'utf8');

      const sub = (args && args[0]) ? args[0].toString().toLowerCase() : "";
      const reply = (txt) => {
        try { return api.sendMessage(txt, event.threadID, event.messageID); } catch (e) { console.error(e); }
      };

      if (sub === 'on') {
        fs.writeFileSync(pathFile, 'true', 'utf8');
        return reply(this._getText('on', getText));
      } else if (sub === 'off') {
        fs.writeFileSync(pathFile, 'false', 'utf8');
        return reply(this._getText('off', getText));
      } else {
        return reply(this._getText('error', getText));
      }
    } catch (err) {
      console.error("autoreact.run error:", err && (err.stack || err));
      try { api.sendMessage("❗ Unexpected error while toggling autoreact.", event.threadID); } catch(e) {}
    }
  },

  // for compatibility with older loaders that call `start`
  start: async function ({ api, events, args }) {
    // map to run
    return this.run({ api, event: events, args });
  }
};
