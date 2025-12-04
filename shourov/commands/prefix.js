module.exports.config = {
  name: "prefix",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "Show bot prefix and owner",
  category: "system",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ event, api, Threads }) => {
  try {
    const { threadID, messageID } = event;
    const body = (event.body || "").trim();
    if (!body) return;

    // safe get thread data + prefix
    let threadSetting = {};
    try {
      const tData = (Threads && typeof Threads.getData === "function") ? await Threads.getData(threadID) : null;
      threadSetting = (tData && tData.threadInfo) ? tData.threadInfo : (tData && tData.data ? tData.data : (tData || {}));
    } catch (e) {
      threadSetting = {};
    }
    const prefix = (threadSetting && threadSetting.PREFIX) ? threadSetting.PREFIX : (global.config && global.config.PREFIX ? global.config.PREFIX : "/");

    // owner name: try common config keys, fallback to "shourov"
    const ownerName = (global.config && (global.config.OWNER || global.config.ownerName || global.config.BOT_OWNER)) || "shourov";

    // triggers (case-insensitive)
    const triggers = [
      "mpre","mprefix","prefix", "command mark",
      "what is the prefix of the bot?","prefix"
    ].map(t => t.toLowerCase());

    if (triggers.includes(body.toLowerCase())) {
      return api.sendMessage(`🔰 Bot prefix: ${prefix}\n👤 Bot owner: ${ownerName}`, threadID, messageID);
    }
  } catch (err) {
    console.error("prefix handleEvent error:", err && (err.stack || err));
  }
};

module.exports.run = async ({ event, api }) => {
  return api.sendMessage("This command is handled via messages (no-prefix). Send 'prefix' to see the bot prefix.", event.threadID);
};