module.exports.config = {
    name: "prefix",
    version: "2.0.0",
    permission: 0,
    credits: "shourov (improved)",
    prefix: false,
    description: "Show bot prefix & owner info",
    category: "system",
    usages: "/prefix",
    cooldowns: 3
};

module.exports.handleEvent = async ({ api, event, Threads }) => {
    const body = event.body?.toLowerCase() || "";
    const threadID = event.threadID;

    // Commands that will trigger prefix response without prefix
    const triggers = ["prefix", "mpre", "mprefix", "command mark", "what is prefix", "bot prefix"];

    if (!triggers.includes(body)) return;

    const threadSetting = global.data.threadData.get(threadID) || {};
    const prefix = threadSetting.PREFIX || global.config.PREFIX || "/";

    return api.sendMessage(
        `✨ 𝗕𝗼𝘁 𝗣𝗿𝗲𝗳𝗶𝘅 : ${prefix}\n` +
        `👑 𝗢𝘄𝗻𝗲𝗿 : 𝗔𝗹𝗜𝗛𝗦𝗔𝗡 𝗦𝗛𝗢𝗨𝗥𝗢𝗩\n` +
        `📌 Type '${prefix}help' to see commands list.`,
        threadID
    );
};

module.exports.run = async ({ api, event, Threads }) => {
    const threadID = event.threadID;

    const threadSetting = global.data.threadData.get(threadID) || {};
    const prefix = threadSetting.PREFIX || global.config.PREFIX || "/";

    return api.sendMessage(
        `🌐 𝗕𝗼𝘁 𝗣𝗿𝗲𝗳𝗶𝘅 𝗜𝗻𝗳𝗼\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🔹 𝗣𝗿𝗲𝗳𝗶𝘅 : ${prefix}\n` +
        `🔹 𝗕𝗼𝘁 𝗢𝘄𝗻𝗲𝗿 : 𝗔𝗹𝗜𝗛𝗦𝗔𝗡 𝗦𝗛𝗢𝗨𝗥𝗢𝗩\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💡 Example: ${prefix}help`,
        threadID,
        event.messageID
    );
};