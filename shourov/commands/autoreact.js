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
    description: "Auto react to incoming messages when enabled",
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
      "off": 'the autoreact function has been disabled for new messages.',
      "on": 'the autoreact function is now enabled for new messages.',
      "error": 'incorrect syntax'
    }
  },

  // ensure folder + file exists
  _ensureFile: async function () {
    try {
      await fs.ensureDir(dir);
      if (!await fs.pathExists(pathFile)) {
        await fs.writeFile(pathFile, 'false', 'utf8');
      }
    } catch (e) {
      console.error('autoreact ensureFile error:', e);
    }
  },

  handleEvent: async ({ api, event, Threads }) => {
    try {
      await module.exports._ensureFile();

      // safety: make sure we have a messageID (only react to messages)
      if (!event || !event.messageID) return;

      const isEnable = (await fs.readFile(pathFile, 'utf8')).trim();
      if (isEnable !== 'true') return;

      const reactions = [
        "💀","🙄","🤭","🥺","😶","😝","👿","🤓","🥶","🗿","😾","🤪","🤬",
        "🤫","😼","😶‍🌫️","😎","🤦","💅","👀","☠️","🧠","👺","🤡","🤒",
        "🤧","😫","😇","🥳","😭"
      ];
      const nayan = reactions[Math.floor(Math.random() * reactions.length)];

      // set reaction (check signature)
      if (typeof api.setMessageReaction === 'function') {
        api.setMessageReaction(nayan, event.messageID, (err) => {
          if (err) console.error('Error sending reaction:', err);
        }, true);
      } else {
        // fallback: some frameworks use different names — try best-effort
        try {
          // many frameworks allow sendMessage with reaction object; keep safe fallback minimal
          console.warn('api.setMessageReaction not available on this bot framework.');
        } catch (e) {}
      }
    } catch (err) {
      console.error('autoreact handleEvent error:', err);
    }
  },

  // CLI / command to toggle on/off (keeps your original start signature)
  start: async ({ nayan, events, args, lang }) => {
    try {
      await module.exports._ensureFile();

      const command = (args && args[0]) ? String(args[0]).toLowerCase() : '';

      if (command === 'on') {
        await fs.writeFile(pathFile, 'true', 'utf8');
        return nayan.sendMessage(lang("on"), events.threadID, events.messageID);
      } else if (command === 'off') {
        await fs.writeFile(pathFile, 'false', 'utf8');
        return nayan.sendMessage(lang("off"), events.threadID, events.messageID);
      } else {
        return nayan.sendMessage(lang("error"), events.threadID, events.messageID);
      }
    } catch (e) {
      console.error('autoreact start error:', e);
      try { nayan.sendMessage('An error occurred while toggling autoreact.', events.threadID, events.messageID); } catch (er) {}
    }
  }
};