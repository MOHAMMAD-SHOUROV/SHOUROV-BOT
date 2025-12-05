// commands/00love.js
const fs = require("fs");

module.exports.config = {
  name: "sanjida",
  version: "2.0.1",
  permission: 0,
  credits: "(fixed by shourov)",
  description: "Responds when someone calls Anika / আনিকা etc.",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = async function({ api, event, client, __GLOBAL }) {
  try {
    const { threadID, messageID } = event;
    const rawBody = (event.body || "");
    if (!rawBody || typeof rawBody !== "string") return;

    // Normalize: remove punctuation/symbols (keeps Unicode letters/numbers/spaces), trim leading spaces, lowercase
    const normalized = rawBody
      .replace(/[^\p{L}\p{N}\s@]/gu, "") // keep letters, numbers, spaces and @ (for mentions)
      .trimStart()
      .toLowerCase();

    // triggers to check at start of message
    const triggers = [
      "@angl anika",
      "angl anika",
      "anika",
      "আনিকা"
    ];

    const startsWithTrigger = triggers.some(t => normalized.startsWith(t));

    // also check if message contains a mention of "Anika" via event.mentions values
    let mentionMatch = false;
    try {
      const mentions = event.mentions || {};
      for (const id of Object.keys(mentions)) {
        const name = (mentions[id] || "").toString().toLowerCase();
        if (!name) continue;
        if (name.includes("anika") || name.includes("আনিকা")) {
          mentionMatch = true;
          break;
        }
      }
    } catch (e) {
      mentionMatch = false;
    }

    if (startsWithTrigger || mentionMatch) {
      const reply = "কিরে ওরে ডাকিস কেন? দেখস না আমার বস সৌরভ এর সাথে ব্যস্ত, পরে কল করো 🤬";
      await api.sendMessage(reply, threadID, messageID);
    }
  } catch (err) {
    console.error("00love handleEvent error:", err && (err.stack || err));
  }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
  // kept for compatibility; module is event-driven
};