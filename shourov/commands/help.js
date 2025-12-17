module.exports.config = {
  name: "help",
  version: "1.0.0",
  permission: 0,
  prefix: true,
  credits: "debug",
  description: "test help",
  category: "system",
  usages: "",
  cooldowns: 0
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("✅ HELP COMMAND WORKING", event.threadID, event.messageID);
};