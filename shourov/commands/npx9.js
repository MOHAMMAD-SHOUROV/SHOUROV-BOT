const fs = require("fs");

module.exports = {
  config: {
    name: "🤭",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "shourov (fixed)",
    description: "Shy / embarrassed emoji auto audio reply",
    category: "no prefix",
    usages: "auto",
    cooldowns: 5,
  },

  handleEvent: function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      // Keep the original text (emoji checks do not require toLowerCase)
      const text = String(body).trim();

      // Triggers (emoji + common shy-related words)
      const triggers = ["🤭", "🙈", "🙊", "🤫", "shy", "sorom", "শরম"];

      // Match if message starts with or contains any trigger
      const isTriggered = triggers.some(tr => {
        // compare both raw text (for emojis) and lowercase (for words)
        return text.startsWith(tr) || text.toLowerCase().includes(String(tr).toLowerCase());
      });

      if (!isTriggered) return;

      const filePath = __dirname + "/shourov/sorom.mp3";
      if (!fs.existsSync(filePath)) {
        console.error(`[${this.config.name}] missing audio file: ${filePath}`);
        return;
      }

      const msg = {
        body: "আঁমিঁ বলুঁম্ না — আমার শরম লাগে 😳",
        attachment: fs.createReadStream(filePath),
      };

      // Send message and react to the sent message (use info.messageID)
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.error(`[${this.config.name}] sendMessage error:`, err);
          return;
        }
        try {
          // react to the bot's sent message (info.messageID). If not supported, ignore.
          api.setMessageReaction("😊", info.messageID, () => {}, true);
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