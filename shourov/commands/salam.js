// commands/salam.js
"use strict";

module.exports.config = {
  name: "salam",
  version: "2.1.0",
  permission: 0,
  credits: "Shourov (fixed)",
  description: "Auto reply to Salam / Assalamualaikum",
  prefix: false,
  category: "no-prefix",
  usages: "",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event.body || typeof event.body !== "string") return;

    const { threadID, messageID } = event;

    // 🔹 normalize text (emoji + punctuation safe)
    const text = event.body
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .toLowerCase()
      .trim();

    // 🔹 greeting triggers
    const greetings = [
      "asalamualaikum",
      "assalamualaikum",
      "asalamu alaikum",
      "asalam u alaikum",
      "আসালামু আলাইকুম",
      "আসসালামু আলাইকুম",
      "সালাম"
    ];

    const matched = greetings.some(g =>
      text === g || text.startsWith(g)
    );

    if (!matched) return;

    const reply =
      "ওয়ালাইকুমুস সালাম 🤍\nআপনি কেমন আছেন? আমি কীভাবে সাহায্য করতে পারি? 😊";

    return api.sendMessage(reply, threadID, messageID);

  } catch (err) {
    console.error("❌ salam error:", err?.message || err);
  }
};

// kept for loader compatibility
module.exports.run = function () {};