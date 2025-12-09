const fs = require("fs");

module.exports = {
  config: {
    name: "😍",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Fun",
    category: "no prefix",
    usages: "emoji trigger",
    cooldowns: 5,
  },

  handleEvent: function ({ api, event }) {
    try {
      const { threadID, messageID } = event;
      const body = (event.body || "").toString();
      if (!body) return;

      // For emoji triggers we don't need to lower-case, but keep text form safe
      const text = body.trim();

      // Trigger list — add/remove emojis or words as you like
      const triggers = ["😍", "🥰", "🤩", "❤️"];

      // If any trigger is at the start or included in the message
      const isTriggered = triggers.some(trigger => text.startsWith(trigger) || text.includes(trigger));
      if (!isTriggered) return;

      // Path to your media file
      const filePath = __dirname + "/Nayan/এত ভালোবাসা কই পাও আ (1).m4a";

      if (!fs.existsSync(filePath)) return; // silently exit if file missing

      const msg = {
        body: "এঁতঁ ভাঁলোঁবাঁসাঁ পাঁওঁ আঁমাঁরঁ বঁসঁ সৌঁরঁভঁ কেঁ এঁকঁটুঁ দেঁওঁ",
        attachment: fs.createReadStream(filePath),
      };

      // send message and react to the message the bot sends (info.messageID)
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.error("[😍] sendMessage error:", err);
          return;
        }
        try {
          api.setMessageReaction("😁", info.messageID, () => {}, true);
        } catch (e) {
          console.error("[😍] setMessageReaction error:", e);
        }
      }, messageID);

    } catch (error) {
      console.error("[😍] handleEvent error:", error && (error.stack || error));
      try { api.sendMessage("⚠️ একটি ত্রুটি ঘটেছে!", event.threadID); } catch (e) {}
    }
  },

  start: function () {}
};