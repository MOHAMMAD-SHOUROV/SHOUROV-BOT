const fs = require("fs");

module.exports = {
  config: {
    name: "🤬",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "nayan (fixed by Shourov)",
    description: "Angry emoji auto audio reply",
    category: "no prefix",
    usages: "auto",
    cooldowns: 5,
  },

  handleEvent: function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      // no lowerCase needed for emoji but safe
      const text = body.trim();

      // Triggers list
      const triggers = ["😡", "😠", "😤", "😾"];

      // Check match (startsWith OR includes)
      const isTriggered = triggers.some(tr => text.startsWith(tr) || text.includes(tr));
      if (!isTriggered) return;

      // Audio file path
      const filePath = __dirname + "/shourov/ragkoro.mp3";
      if (!fs.existsSync(filePath)) {
        console.error("Missing file:", filePath);
        return;
      }

      const msg = {
        body: "রাঁগঁ কঁরোঁ কেঁনোঁ গোঁ😡🥺",
        attachment: fs.createReadStream(filePath),
      };

      // Send message, then react to the *bot-sent* message
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) return;

        try {
          api.setMessageReaction("😁", info.messageID, () => {}, true);
        } catch (e) {}
      });

    } catch (err) {
      console.error("[🤬] Error:", err);
    }
  },

  start: function () {}
};