// commands/prefix.js

module.exports.config = {
  name: "prefix",
  version: "2.3.0",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "Show bot prefix info",
  category: "system",
  usages: "prefix",
  cooldowns: 2
};

// text clean helper
function clean(text = "") {
  return text.toString().trim().toLowerCase();
}

// 🔹 no-prefix trigger (only "prefix")
module.exports.handleEvent = async ({ api, event }) => {
  try {
    if (!event.body) return;

    const body = clean(event.body);

    // শুধু prefix লিখলে কাজ করবে
    if (body !== "prefix") return;

    const prefix = global.config.PREFIX || "/";
    const owner = global.config.BOT_OWNER || global.config.OWNER_NAME || "KING SHOUROV";

    const msg =
`╭╼|━━━━━━━━━━━━━━|╾╮
        ✦  BOT INFO  ✦
Bot Prefix : ${prefix}
Bot Owner  : ${owner}
╰╼|━━━━━━━━━━━━━━|╾╯

✨ Use the prefix to run commands
Example:
${prefix}help`;

    return api.sendMessage(msg, event.threadID);
  } catch (e) {
    console.error("prefix handleEvent error:", e);
  }
};

// 🔹 prefix command (/prefix)
module.exports.run = async ({ api, event }) => {
  try {
    const prefix = global.config.PREFIX || "/";
    const owner = global.config.BOT_OWNER || global.config.OWNER_NAME || "KING SHOUROV";

    const msg =
`╭╼|━━━━━━━━━━━━━━|╾╮
        ✦  BOT INFO  ✦
Bot Prefix : ${prefix}
Bot Owner  : ${owner}
╰╼|━━━━━━━━━━━━━━|╾╯

✨ Use the prefix to run commands
Example:
${prefix}help`;

    return api.sendMessage(msg, event.threadID, event.messageID);
  } catch (e) {
    console.error("prefix run error:", e);
    return api.sendMessage("❌ Prefix info load failed.", event.threadID);
  }
};