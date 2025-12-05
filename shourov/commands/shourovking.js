// commands/00fun1.js
const fs = require("fs");

module.exports.config = {
  name: "00fun1",
  version: "2.0.1",
  permission: 0,
  credits: " (fixed by shourov)",
  description: "Responds when message starts with Shourov / সৌরভ / KING SHOUROV etc.",
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

    // Normalize: remove control/symbol characters but keep letters/numbers/space (Unicode-aware)
    // Then trim leading spaces and lowercase for matching
    const normalized = rawBody
      .replace(/[^\p{L}\p{N}\s]/gu, "") // remove punctuation/symbols (keeps letters/numbers/space)
      .trimStart()
      .toLowerCase();

    // trigger words (you can add more)
    const triggers = [
      "shourov",
      "সৌরভ",
      "Shourov",
      "Alihsan Shourov", // if you want 'king' alone to trigger, keep it; otherwise remove
      // add other plain forms if needed
    ];

    // check if normalized text starts with any trigger
    const startsWithTrigger = triggers.some(t => normalized.startsWith(t));

    if (startsWithTrigger) {
      const reply = "_আসসালামু আলাইকুম, আমি সৌরভ'র বট। কিভাবে সহযোগিতা করতে পারি আপনাকে? 🤙🫵☑️_";
      await api.sendMessage(reply, threadID, messageID);
    }
  } catch (err) {
    console.error("00fun1 handleEvent error:", err && (err.stack || err));
  }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
  // kept for compatibility; this module is event-driven
};