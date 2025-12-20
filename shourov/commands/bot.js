// commands/bot.js
const axios = require("axios");

module.exports = {
  config: {
    name: "bot",
    aliases: ["mim"],
    version: "1.0.0",
    permission: 0,
    credits: "fixed",
    description: "chat bot",
    category: "talk"
  },

  handleReply: async function ({ api, event }) {
    try {
      if (!global.client) global.client = {};
      if (!global.client.handleReply) global.client.handleReply = [];

      const userName =
        global.data?.userName?.get(event.senderID) ||
        (await api.getUserInfo(event.senderID))[event.senderID]?.name ||
        "User";

      api.sendMessage(
        `${userName}, তুমি বলছো: ${event.body}`,
        event.threadID,
        (err, info) => {
          global.client.handleReply.push({
            name: "bot",
            messageID: info.messageID,
            author: event.senderID
          });
        },
        event.messageID
      );

    } catch (e) {
      console.log("handleReply error:", e);
    }
  },

  run: async function ({ api, event }) {
    try {
      if (!global.client) global.client = {};
      if (!global.client.handleReply) global.client.handleReply = [];

      api.sendMessage(
        "BOT COMMAND WORKING ✅\nএখন reply দাও",
        event.threadID,
        (err, info) => {
          global.client.handleReply.push({
            name: "bot",
            messageID: info.messageID,
            author: event.senderID
          });
        },
        event.messageID
      );

    } catch (e) {
      console.log("run error:", e);
    }
  }
};
