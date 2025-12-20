// commands/bot.js
module.exports = {
  config: {
    name: "bot",
    aliases: ["mim"],
    version: "1.0.1",
    permission: 0,
    credits: "fixed",
    description: "reply test",
    category: "talk"
  },

  handleReply: async function ({ api, event }) {
    const userName =
      global.data?.userName?.get(event.senderID) || "User";

    api.sendMessage(
      `${userName}, তুমি বলছো: ${event.body}`,
      event.threadID,
      (err, info) => {
        global.client.handleReply.push({
          type: "reply", // 🔥 VERY IMPORTANT
          name: "bot",
          messageID: info.messageID,
          author: event.senderID
        });
      },
      event.messageID
    );
  },

  run: async function ({ api, event }) {
    if (!global.client) global.client = {};
    if (!global.client.handleReply) global.client.handleReply = [];

    api.sendMessage(
      "BOT COMMAND WORKING ✅\nএখন reply দাও",
      event.threadID,
      (err, info) => {
        global.client.handleReply.push({
          type: "reply", // 🔥 MUST
          name: "bot",
          messageID: info.messageID,
          author: event.senderID
        });
      },
      event.messageID
    );
  }
};
