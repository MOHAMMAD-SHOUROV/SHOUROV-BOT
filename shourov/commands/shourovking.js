// commands/00fun1.js  
// Fully compatible with Shourov/Nayan Loader System

const fs = require("fs");

module.exports.config = {
  name: "00fun1",
  version: "2.0.1",
  permission: 0,
  credits: "Shourov (fixed & optimized)",
  description: "Auto reply when message starts with Shourov / সৌরভ etc.",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, messageID, body } = event;
    if (!body || typeof body !== "string") return;

    // Clean & normalize the message
    const cleaned = body
      .replace(/[^\p{L}\p{N}\s]/gu, "")   // removes emojis, symbols, punctuation
      .trimStart()
      .toLowerCase();

    // Trigger list
    const triggers = [
      "shourov",
      "king shourov",
      "souroav",
      "সৌরভ",
      "শৌরভ",
      "alihsan shourov",
      "boss shourov"
    ];

    // Check if message starts with any trigger
    const matched = triggers.some(t => cleaned.startsWith(t));

    if (matched) {
      const reply = 
`🖤 আসসালামু আলাইকুম 
আমি **সৌরভের অফিশিয়াল বট 🤖**

আপনাকে কিভাবে সাহায্য করতে পারি? 😊`;

      api.sendMessage(reply, threadID, messageID);
    }

  } catch (err) {
    console.error("❌ ERROR in 00fun1.js:", err);
  }
};

// Not needed but kept for system compatibility
module.exports.run = function () {};