const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "angry",
    version: "1.1.0",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Multi emoji auto audio reply",
    category: "auto"
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = String(body);

      const rules = [
        {
          triggers: ["😖", "😣", "😫", "🙉"],
          audio: "banortor.mp3",
          msg: "কিঁরেঁ বাঁনঁরঁ তোঁরঁ আঁবাঁরঁ কিঁ হঁলোঁ"
        },
        {
          triggers: ["😎", "😈", "👿", "🤙"],
          audio: "attitude.mp3",
          msg: "তুঁমিঁ attitude দেঁখাঁচ্ছঁ তাঁতেঁ আঁমাঁরঁ বাঁলঁ ছেঁড়াঁ গেঁলোঁ 😎"
        },
        {
          triggers: ["💔", "🥺", "😢"],
          audio: "brkup.mp3",
          msg: "জাঁনেঁমাঁনঁ তোঁমাঁরঁ কিঁ breakup হঁয়ঁছেঁ 💔"
        }
      ];

      for (const rule of rules) {
        if (rule.triggers.some(t => text.includes(t))) {
          const audioPath = path.join(__dirname, "shourov", rule.audio);

          if (!fs.existsSync(audioPath)) {
            console.log("[angry] Audio missing:", audioPath);
            return;
          }

          return api.sendMessage(
            {
              body: rule.msg,
              attachment: fs.createReadStream(audioPath)
            },
            threadID,
            messageID
          );
        }
      }

    } catch (e) {
      console.error("[angry] error:", e);
    }
  },

  run: async function () {}
};