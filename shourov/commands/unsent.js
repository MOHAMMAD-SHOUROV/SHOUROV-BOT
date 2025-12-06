module.exports.config = {
  name: "uns",
  version: "1.0.5",
  permission: 2,
  credits: "shourov",
  prefix: true,
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

module.exports.run = function ({ api, event, getText }) {

  // Must be reply
  if (event.type !== "message_reply") {
    return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
  }

  // Only unsend bot messages
  if (event.messageReply.senderID !== api.getCurrentUserID()) {
    return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);
  }

  // Unsend message
  return api.unsendMessage(event.messageReply.messageID);
};
