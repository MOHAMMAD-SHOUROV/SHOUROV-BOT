const fs = require('fs-extra');
const pathFile = __dirname + '/autoseen/autoseen.txt';

module.exports = {
  config: {
    name: "autoseen",
    version: "1.0.0",
    permission: 2,
    credits: "Shourov",
    description: "Turn on/off automatically seen when new messages arrive",
    prefix: true,
    category: "system",
    usages: "[on/off]",
    cooldowns: 5
  },

  handleEvent: async ({ api, event }) => {
    if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, 'false');
    const isEnable = fs.readFileSync(pathFile, 'utf-8');
    if (isEnable === 'true') {
      api.markAsReadAll(() => {});
    }
  },

  start: async ({ api, event, args }) => {
    try {
      if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, 'false');

      if (args[0] === 'on') {
        fs.writeFileSync(pathFile, 'true');
        api.sendMessage('✅ Autoseen is now enabled for new messages.', event.threadID, event.messageID);
      } else if (args[0] === 'off') {
        fs.writeFileSync(pathFile, 'false');
        api.sendMessage('❌ Autoseen has been disabled for new messages.', event.threadID, event.messageID);
      } else {
        api.sendMessage('⚠️ Incorrect syntax, use "autoseen on" or "autoseen off".', event.threadID, event.messageID);
      }
    } catch (e) {
      console.error("Unexpected error while using autoseen function:", e);
    }
  }
};
