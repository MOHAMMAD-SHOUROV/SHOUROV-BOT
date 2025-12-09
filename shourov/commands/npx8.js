const fs = require("fs");

module.exports = {
  config: {
    name: "😡",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "nayan (fixed)",
    description: "Angry emoji auto audio reply",
    category: "no prefix",
    usages: "auto",
    cooldowns: 5,
  },

  handleEvent: function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      // Keep original text (emoji check doesn't need toLowerCase but it's safe)
      const text = String(body).trim().toLowerCase();

      // Trigger list
      const triggers = ["😡", "🤬", "😠", "😤", "😾"];

      // Match if message starts with or includes any trigger
      const isTriggered = triggers.some(tr => text.startsWith(tr) || text.includes(tr));
      if (!isTriggered) return;

      // Audio path
      const filePath = __dirname + "/shourov/ragkoro.mp3";
      if (!fs.existsSync(filePath)) {
        console.error(`[${this.config.name}] missing audio file:`, filePath);
        return;
      }

      const msg = {
        body: "রাগ কোরো না ভাইয়া 😡",
        attachment: fs.createReadStream(filePath),
      };

      // Send and react to the message the bot sends (use info.messageID)
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.error(`[${this.config.name}] sendMessage error:`, err);
          return;
        }
        try {
          api.setMessageReaction("😁", info.messageID, () => {}, true);
        } catch (e) {
          // ignore reaction errors
        }
      }, messageID);
    } catch (err) {
      console.error(`[${this.config.name}] handleEvent error:`, err);
    }
  },

  start: function () {}
};
```0