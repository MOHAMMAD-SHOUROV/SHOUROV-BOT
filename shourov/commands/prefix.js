// commands/prefix.js
module.exports.config = {
  name: "prefix",
  version: "2.1.0",
  permission: 0,
  credits: "shourov (fixed)",
  prefix: true,            // allow prefix invocation like /prefix
  description: "Show bot prefix & owner info",
  category: "system",
  usages: "/prefix",
  cooldowns: 2
};

module.exports.name = module.exports.config.name;

function normalizeText(s = "") {
  // trim, lowercase, remove extra punctuation and multiple spaces
  return s.toString().replace(/[^\w\s\/@-]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

module.exports.handleEvent = async ({ event, api, Threads }) => {
  try {
    const bodyRaw = event.body || "";
    if (!bodyRaw) return;

    const body = normalizeText(bodyRaw);

    // triggers to respond to even when user doesn't type prefix
    const triggers = new Set([
      "prefix", "mpre", "mprefix", "command mark",
      "what is the prefix", "what is the prefix of the bot", "bot prefix",
      "what is the prefix of the bot?"
    ]);

    // If user typed one of the trigger phrases exactly (case-insensitive)
    if (!triggers.has(body)) return;

    // get prefix from thread settings or global config
    let prefix = "/";
    try {
      const threadSetting = (global.data && global.data.threadData && global.data.threadData.get && global.data.threadData.get(event.threadID)) || {};
      prefix = threadSetting.PREFIX || global.config.PREFIX || prefix;
    } catch (e) {
      prefix = global.config.PREFIX || prefix;
    }

    const ownerName = global.config.OWNER_NAME || global.config.BOT_OWNER || "AlIHSAN SHOUROV";

    const msg =
      `✨ 𝗕𝗼𝘁 𝗣𝗿𝗲𝗳𝗶𝘅 𝗜𝗻𝗳𝗼 ✨\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🔹 𝗣𝗿𝗲𝗳𝗶𝘅 :  ${prefix}\n` +
      `🔹 𝗢𝘄𝗻𝗲𝗿 :  ${ownerName}\n` +
      `🔹 𝗛𝗲𝗹𝗽  :  Type "${prefix}help" to see commands\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Tip: you can also type "prefix" (without ${prefix}) to see this message.`;

    return api.sendMessage(msg, event.threadID);
  } catch (err) {
    console.error("prefix handleEvent error:", err);
  }
};

module.exports.run = async ({ event, api, Threads }) => {
  try {
    const threadID = event.threadID;

    // try to get thread prefix from Threads helper (safe)
    let prefix = "/";
    try {
      const threadSetting = (global.data && global.data.threadData && global.data.threadData.get && global.data.threadData.get(threadID)) || {};
      prefix = threadSetting.PREFIX || global.config.PREFIX || prefix;
    } catch (e) {
      prefix = global.config.PREFIX || prefix;
    }

    const ownerName = global.config.OWNER_NAME || global.config.BOT_OWNER || "AlIHSAN SHOUROV";

    const msg =
      `🌐 𝗕𝗼𝘁 𝗣𝗿𝗲𝗳𝗶𝘅 𝗗𝗲𝘁𝗮𝗶𝗹𝘀\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🔹 𝗣𝗿𝗲𝗳𝗶𝘅 : ${prefix}\n` +
      `🔹 𝗢𝘄𝗻𝗲𝗿 : ${ownerName}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💡 Example: ${prefix}help`;

    return api.sendMessage(msg, threadID, event.messageID);
  } catch (err) {
    console.error("prefix run error:", err);
    return api.sendMessage("An error occurred while fetching prefix.", event.threadID);
  }
};