// commands/00fun1.js
// Fully compatible with Shourov/Nayan Loader System

module.exports.config = {
  name: "00fun1",
  version: "2.1.0",
  permission: 0,
  credits: "Shourov (fixed & optimized)",
  description: "Auto reply when message mentions Shourov / সৌরভ",
  prefix: false,
  category: "user",
  cooldowns: 3
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event.body) return;
    if (event.senderID === api.getCurrentUserID()) return;

    const cleaned = event.body
      .replace(/[^a-zA-Z0-9\u0980-\u09FF\s]/g, "") // safe regex
      .toLowerCase()
      .trim();

    const triggers = [
      "shourov",
      "king shourov",
      "souroav",
      "সৌরভ",
      "শৌরভ",
      "alihsan shourov",
      "boss shourov",
      "alihsan"
    ];

    const matched = triggers.some(t =>
      cleaned === t ||
      cleaned.startsWith(t) ||
      cleaned.includes(t)
    );

    if (!matched) return;

    const reply =
`🖤 আসসালামু আলাইকুম
আমি **সৌরভের অফিসিয়াল বট 🤖**

আপনাকে কিভাবে সাহায্য করতে পারি? 😊`;

    api.sendMessage(reply, event.threadID, event.messageID);

  } catch (err) {
    console.error("❌ ERROR in 00fun1.js:", err);
  }
};

module.exports.run = function () {};