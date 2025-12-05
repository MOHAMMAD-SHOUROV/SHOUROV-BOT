// commands/
const fs = require("fs");

module.exports.config = {
  name: "salam",
  version: "2.0.1",
  permission: 0,
  credits: "shourov (fixed by assistant)",
  description: "Auto reply to greetings",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
  try {
    const { threadID, messageID } = event;
    const body = (event.body || "").toString().trim();

    if (!body) return; // no text -> ignore

    // normalize to lowercase for easier comparison
    const text = body.toLowerCase();

    // possible greeting variants to match (you can add more)
    const greetings = [
      "asalamualaikum",
      "assalamualaikum",
      "asalamu alaikum",
      "asalam u alaikum",
      "আসালামু আলাইকুম",
      "আসসালামু আলাইকুম",
      "সালাম",
      "ওয়ালাইকুম"
    ];

    // check if any greeting is present at start (or whole message)
    const isGreeting = greetings.some(g => text.startsWith(g) || text === g);

    if (isGreeting) {
      // polite reply
      const replyText = "ওয়ালাইকুমুস সালাম! 😊\nআপনি কেমন আছেন? আমি সাহায্য করতে পারি কীভাবে?";
      return api.sendMessage(replyText, threadID, messageID);
    }

  } catch (e) {
    // fail silently but log for debugging
    console.error("salam handleEvent error:", e && (e.stack || e));
  }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
  // optional manual trigger (if you want)
  return api.sendMessage("জি! 'asalamualaikum' বললে আমি স্বাগত জানাই।", event.threadID);
};