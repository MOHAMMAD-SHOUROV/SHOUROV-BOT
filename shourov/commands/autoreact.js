const fs = require('fs-extra');
const path = require('path');

const dirPath = path.join(__dirname, 'autoreact');
const pathFile = path.join(dirPath, 'autoreact.txt');

module.exports = {
  config: {
    name: "autoreact",
    version: "1.0.1",
    permission: 0,
    credits: "shourov",
    description: "Automatically react to new messages when enabled",
    prefix: 'awto', 
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
    "vi": {},
    "en": {
      "off": 'The autoreact function has been disabled for new messages.',
      "on": 'The autoreact function is now enabled for new messages.',
      "error": 'Incorrect syntax. Use: awtoautoreact on/off'
    }
  },

  /**
   * handleEvent runs on every incoming event.
   * It reads the status file and if enabled, sends a random reaction.
   */
  handleEvent: async ({ api, event, Threads }) => {
    try {
      // ensure folder & file exist
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
      if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, 'false', 'utf8');

      const isEnable = (fs.readFileSync(pathFile, 'utf8') || '').trim();

      if (isEnable === 'true') {
        // List of reactions (customize as you like)
        const reactions = [
          "💀","🙄","🤭","🥺","😶","😝","👿","🤓","🥶","🗿","😾","🤪","🤬",
          "🤫","😼","😶‍🌫️","😎","🤦","💅","👀","☠️","🧠","👺","🤡","🤒",
          "🤧","😫","😇","🥳","😭"
        ];

        // pick random reaction
        const reaction = reactions[Math.floor(Math.random() * reactions.length)];

        // event.messageID may be undefined for some event types — check first
        if (!event || !event.messageID) return;

        // Use try/catch because some message types or permissions may fail
        try {
          // Note: setMessageReaction signature differs across libs.
          // Common: api.setMessageReaction(reaction, messageID, callback)
          // Older: api.setMessageReaction(reaction, messageID, callback, true)
          // We'll attempt both patterns safely.
          let called = false;
          try {
            api.setMessageReaction(reaction, event.messageID, (err) => {
              if (err) console.error("[AutoReact] setMessageReaction err:", err);
            });
            called = true;
          } catch (e) {
            // fallback with fourth param (some libs expect a boolean)
          }
          if (!called) {
            try {
              api.setMessageReaction(reaction, event.messageID, (err) => {
                if (err) console.error("[AutoReact] setMessageReaction err:", err);
              }, true);
            } catch (err) {
              console.error("[AutoReact] Unable to call setMessageReaction:", err);
            }
          }
        } catch (err) {
          console.error("[AutoReact] Reaction error:", err);
        }
      }
    } catch (e) {
      console.error("[AutoReact] handleEvent error:", e);
    }
  },

  /**
   * start (command entry) to turn on/off autoreact
   * Example usage:
   *   awtoautoreact on
   *   awtoautoreact off
   */
  start: async ({ nayan, events, args, lang }) => {
    try {
      // ensure folder & file exist
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
      if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, 'false', 'utf8');

      const logger = global.utils && global.utils.logger ? global.utils.logger : console.log;

      const mode = (args[0] || '').toLowerCase();
      if (mode === 'on') {
        fs.writeFileSync(pathFile, 'true', 'utf8');
        return nayan.sendMessage(lang("on"), events.threadID, events.messageID);
      } else if (mode === 'off') {
        fs.writeFileSync(pathFile, 'false', 'utf8');
        return nayan.sendMessage(lang("off"), events.threadID, events.messageID);
      } else {
        return nayan.sendMessage(lang("error"), events.threadID, events.messageID);
      }
    } catch (e) {
      console.error("[AutoReact] start error:", e);
      try {
        return nayan.sendMessage("⚠️ Unexpected error occurred while toggling autoreact.", events.threadID, events.messageID);
      } catch (err) {
        // silent
      }
    }
  }
};