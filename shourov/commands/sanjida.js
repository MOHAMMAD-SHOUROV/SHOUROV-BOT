// commands/00love.js
'use strict';

module.exports.config = {
  name: "sanjida",
  version: "2.1.0",
  permission: 0,
  credits: "Shourov (fixed)",
  description: "Auto reply when someone mentions Anika / আনিকা",
  prefix: false,
  category: "no-prefix",
  usages: "",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event.body || typeof event.body !== "string") return;

    const { threadID, messageID } = event;

    // 🔹 normalize text
    const text = event.body
      .replace(/[^\p{L}\p{N}\s@]/gu, "")
      .toLowerCase()
      .trim();

    // 🔹 triggers
    const triggers = [
      "anika",
      "angl anika",
      "আনিকা"
    ];

    // 🔹 text match
    const textMatch = triggers.some(t =>
      text.startsWith(t) || text.includes(` ${t}`)
    );

    // 🔹 mention match
    let mentionMatch = false;
    if (event.mentions) {
      for (const id in event.mentions) {
        const name = String(event.mentions[id]).toLowerCase();
        if (name.includes("anika") || name.includes("আনিকা")) {
          mentionMatch = true;
          break;
        }
      }
    }

    if (!textMatch && !mentionMatch) return;

    const reply =
      "কিরে ওরে ডাকিস কেন? দেখস না আমার বস সৌরভ এর সাথে ব্যস্ত, পরে কল করো 🤬";

    return api.sendMessage(reply, threadID, messageID);

  } catch (err) {
    console.error("❌ 00love error:", err?.message || err);
  }
};

// kept for loader compatibility
module.exports.run = function () {};