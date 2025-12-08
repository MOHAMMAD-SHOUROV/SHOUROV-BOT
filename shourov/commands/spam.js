module.exports.config = {
  name: "spam",
  version: "1.0.0",
  permssion: 2,
  credits: "shourov",
  description: "Spam any message",
  category: "spam",
  usages: "[msg] [amount]",
  prefix: true,
  cooldowns: 5
};

module.exports.run = function ({ api, event, args }) {
  // Only bot admin can use
  const permission = ["100071971474157"];
  if (!permission.includes(event.senderID)) {
    return api.sendMessage("❌ Only Bot Admin Can Use This Command!", event.threadID, event.messageID);
  }

  // Check minimum 2 arguments
  if (args.length < 2) {
    return api.sendMessage(`Invalid usage!\nUse: ${global.config.PREFIX}spam [msg] [amount]`, event.threadID);
  }

  // Last argument = amount
  const count = parseInt(args[args.length - 1]);
  if (isNaN(count) || count <= 0) {
    return api.sendMessage("❌ Amount must be a valid number!", event.threadID);
  }

  // Message = all words except last one
  const msg = args.slice(0, -1).join(" ");

  // Spam loop
  for (let i = 0; i < count; i++) {
    api.sendMessage(msg, event.threadID);
  }
};