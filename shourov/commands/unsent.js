module.exports.config = {
  name: "uns",
  version: "1.0.6",
  permission: 2,
  prefix: true,
  credits: "shourov",
  description: "Unsend bot messages",
  category: "admin",
  usages: "",
  cooldowns: 5
};

module.exports.languages = {
  vi: {
    returnCant: "Không thể gỡ tin nhắn của người khác.",
    missingReply: "Hãy reply tin nhắn bạn muốn gỡ."
  },
  en: {
    returnCant: "Can't unsend messages from other users.",
    missingReply: "Reply to the message you want to unsend."
  }
};

module.exports.run = async function ({ api, event, getText }) {
  try {
    // Must be reply
    if (event.type !== "message_reply") {
      return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
    }

    const reply = event.messageReply;
    const botID = api.getCurrentUserID ? api.getCurrentUserID() : global.botID;

    // Safety fallback
    if (!botID) {
      return api.sendMessage("Bot ID not detected!", event.threadID, event.messageID);
    }

    // Only unsend bot messages
    if (String(reply.senderID) !== String(botID)) {
      return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);
    }

    // Unsend message
    return api.unsendMessage(reply.messageID);
    
  } catch (err) {
    console.error("UNS ERROR:", err);
    return api.sendMessage("Something went wrong while unsending.", event.threadID, event.messageID);
  }
};