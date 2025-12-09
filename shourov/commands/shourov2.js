const fs = require("fs");

module.exports.config = {
  name: "shourov2",
  version: "2.0.1",
  permission: 0,
  credits: "shourov",
  description: "Respond when someone mentions Shourov",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
  try {
    const { threadID, messageID } = event;

    // যদি মেসেজ না থাকে তাহলে বের হয়ে যাই
    if (!event || !event.body) return;

    // মূল মেসেজের টেক্সট
    const body = String(event.body);

    // normalized lowercase for safe matching (Unicode supported)
    const normalized = body.normalize().toLowerCase();

    // triggers (lowercased) - প্রয়োজনমতো এখানে আরও নাম যোগ করতে পারেন
    const triggers = [
      "alihsan shourov",
      "shourov",
      "সৌরভ",
      "king shourov",
      "শৌরভ"
    ].map(s => s.toLowerCase());

    // check if any trigger appears as a standalone word or substring
    // আমরা substring অনুমোদন রাখলাম কারণ ইউজার প্রায়ই ট্যাগ/উদ্ধৃতি হিসেবে ব্যবহার করে
    const matched = triggers.some(t => normalized.includes(t));

    if (matched) {
      const reply = "আসসালামু আলাইকুম! 😊\nআমি সৌরভ'র বট — কিভাবে সাহায্য করতে পারি?";
      return api.sendMessage(reply, threadID, messageID);
    }
  } catch (err) {
    console.error("shourov2 handleEvent error:", err && (err.stack || err));
  }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
  // kept for compatibility if someone calls it as a command
};