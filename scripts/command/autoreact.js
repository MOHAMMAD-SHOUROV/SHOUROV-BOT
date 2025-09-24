const fs = require('fs-extra');
const pathFile = __dirname + '/autoreact/autoreact.txt';

module.exports = {
  config: {
    name: "autoreact",
    version: "1.0.0",
    permission: 0,
    credits: "Shourov",
    description: "Automatically reacts to new messages",
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
      "error": 'Incorrect syntax, please use "awto on" or "awto off".'
    }
  },

  handleEvent: async ({ api, event }) => {
    if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, 'false');
    const isEnable = fs.readFileSync(pathFile, 'utf-8');
    if (isEnable === 'true') {
      const reactions = ["💀", "🙄", "🤭","🥺","😶","😝","👿","🤓","🥶","🗿","😾","🤪","🤬","🤫","😼","😶‍🌫️","😎","🤦","💅","👀","☠️","🧠","👺","🤡","🤒","🤧","😫","😇","🥳","😭"];
      const reaction = reactions[Math.floor(Math.random() * reactions.length)];

      api.setMessageReaction(reaction, event.messageID, (err) => {
        if (err) console.error("Error sending reaction:", err);
      }, true);
    }
  },

  start: async ({ api, event, args, lang }) => {
    try {
      if (args[0] === 'on') {
        fs.writeFileSync(pathFile, 'true');
        api.sendMessage(lang("on"), event.threadID, event.messageID);
      } else if (args[0] === 'off') {
        fs.writeFileSync(pathFile, 'false');
        api.sendMessage(lang("off"), event.threadID, event.messageID);
      } else {
        api.sendMessage(lang("error"), event.threadID, event.messageID);
      }
    } catch (e) {
      console.error("Unexpected error while using autoreact function:", e);
    }
  }
};
