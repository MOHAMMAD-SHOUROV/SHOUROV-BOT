// commands/prefixInfo.js
const fs = require("fs");

module.exports.config = {
  name: "prefixinfo",
  version: "1.0.0",
  permission: 0,
  credits: "shourov",
  description: "Show bot prefix and owner in stylish format when user sends '/' or '/prefix'",
  category: "no prefix",
  usages: "/  OR  /prefix  OR  /prefixcall",
  cooldowns: 5,
  prefix: false
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, messageID } = event;
    if (!event.body) return;

    const text = String(event.body).trim();
    // respond when exactly "/" or "/prefix" or "/prefixcall" (case-insensitive)
    const lowered = text.toLowerCase();

    const triggers = ["/", "/prefix", "/prefixcall"];
    if (!triggers.includes(lowered)) return;

    // get prefix & owner from global config (with safe fallbacks)
    const prefix = (global.config && global.config.PREFIX) ? global.config.PREFIX : "/";
    // try common keys for owner — adjust to your config file key if different
    const owner = (global.config && (global.config.BOT_OWNER || global.config.OWNER || global.config.owner || global.config.owners))
      ? (Array.isArray(global.config.BOT_OWNER || global.config.owners) ? (global.config.BOT_OWNER || global.config.owners)[0] : (global.config.BOT_OWNER || global.config.OWNER || global.config.owner || global.config.owners))
      : "KING SHOUROV";

    // If owner is numeric ID, try to turn into a name if Users API available (best-effort)
    let ownerDisplay = owner;
    try {
      // global.data.userName map sometimes contains names
      if (global.data && global.data.userName && global.data.userName.get && typeof global.data.userName.get === "function") {
        const name = global.data.userName.get(String(owner));
        if (name) ownerDisplay = name;
      }
    } catch (e) { /* ignore */ }

    // Build stylish message
    const body = [
      "╭╼|━━━━━━━━━━━━━━|╾╮",
      "        ✦  BOT INFO  ✦",
      `Bot Prefix : ${prefix}`,
      `Bot Owner  : ${ownerDisplay}`,
      "╰╼|━━━━━━━━━━━━━━|╾╯",
      "",
      "✨ Use the prefix to run commands. Example:",
      `\t${prefix}help  — show commands`
    ].join("\n");

    // send reply and react (if reaction available)
    await api.sendMessage({ body }, threadID, messageID);
    // try set reaction if API supports it (best-effort)
    if (typeof api.setMessageReaction === "function") {
      try { api.setMessageReaction("✨", messageID, () => {}, true); } catch (e) { /* ignore */ }
    }
  } catch (err) {
    console.error("[prefixInfo] handleEvent error:", err && (err.stack || err));
  }
};

module.exports.run = async function ({ api, event }) {
  // fallback for explicit command invocation (if loader calls run)
  try {
    const { threadID, messageID } = event;
    const prefix = (global.config && global.config.PREFIX) ? global.config.PREFIX : "/";
    const owner = (global.config && (global.config.BOT_OWNER || global.config.OWNER || global.config.owner || global.config.owners))
      ? (Array.isArray(global.config.BOT_OWNER || global.config.owners) ? (global.config.BOT_OWNER || global.config.owners)[0] : (global.config.BOT_OWNER || global.config.OWNER || global.config.owner || global.config.owners))
      : "KING SHOUROV";

    const body = [
      "╭╼|━━━━━━━━━━━━━━|╾╮",
      "        ✦  BOT INFO  ✦",
      `Bot Prefix : ${prefix}`,
      `Bot Owner  : ${owner}`,
      "╰╼|━━━━━━━━━━━━━━|╾╯",
      "",
      "✨ Use the prefix to run commands. Example:",
      `\t${prefix}help  — show commands`
    ].join("\n");

    await api.sendMessage({ body }, threadID, messageID);
    if (typeof api.setMessageReaction === "function") {
      try { api.setMessageReaction("✨", messageID, () => {}, true); } catch (e) { /* ignore */ }
    }
  } catch (e) {
    console.error("[prefixInfo] run error:", e && (e.stack || e));
  }
};