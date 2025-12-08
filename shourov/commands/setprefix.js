module.exports.config = {
  name: "setprefix",
  version: "1.0.0",
  permission: 2,
  prefix: false,
  credits: "shourov",
  description: "Change prefix for your box",
  category: "admin",
  usages: "setprefix <new prefix>/reset",
  cooldowns: 5,
};

module.exports.languages = {
  en: {
    successChange: "Prefix changed to: %1",
    missingInput: "Prefix cannot be empty!",
    resetPrefix: "Prefix reset to default: %1",
    confirmChange: "Are you sure you want to change prefix to: %1 ?\n👉 React to confirm.",
  }
};

module.exports.handleReaction = async ({ api, event, Threads, handleReaction, getText }) => {
  try {
    if (event.userID !== handleReaction.author) return;

    const { threadID, messageID } = event;

    // Get thread data
    let data = (await Threads.getData(threadID)).data || {};

    // Apply new prefix
    data["PREFIX"] = handleReaction.PREFIX;

    // Save database
    await Threads.setData(threadID, { data });
    global.data.threadData.set(threadID, data);

    // Remove confirmation message
    api.unsendMessage(handleReaction.messageID);

    return api.sendMessage(getText("successChange", handleReaction.PREFIX), threadID, messageID);

  } catch (err) {
    console.log(err);
  }
};

module.exports.run = async ({ api, event, args, Threads, getText }) => {
  const { threadID, messageID } = event;

  if (!args[0]) return api.sendMessage(getText("missingInput"), threadID, messageID);

  const prefix = args[0].trim();

  // Reset prefix
  if (prefix === "reset") {
    let data = (await Threads.getData(threadID)).data || {};
    data["PREFIX"] = global.config.PREFIX;

    await Threads.setData(threadID, { data });
    global.data.threadData.set(threadID, data);

    return api.sendMessage(getText("resetPrefix", global.config.PREFIX), threadID, messageID);
  }

  // Ask for confirmation
  api.sendMessage(getText("confirmChange", prefix), threadID, (err, info) => {
    global.client.handleReaction.push({
      name: this.config.name,
      messageID: info.messageID,
      author: event.senderID,
      PREFIX: prefix
    });
  });
};