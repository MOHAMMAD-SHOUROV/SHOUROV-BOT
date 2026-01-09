const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "angry",
    version: "1.0.4",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Attitude emoji auto audio reply",
    category: "auto"
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = String(body);

      const triggers = ["😎", "😈", "👿", "🤙"];
      if (!triggers.some(t => text.includes(t))) return;

      const audioPath = path.join(__dirname, "shourov", "attitude.mp3");

      if (!fs.existsSync(audioPath)) {
        console.log("[angry] Audio not found:", audioPath);
        return;
      }

      api.sendMessage(
        {
          body: "তুঁমিঁ attitude দেঁখাঁচ্ছঁ তাঁতেঁ আঁমাঁরঁ বাঁলঁ ছেঁড়াঁ গেঁলোঁ 😎",
          attachment: fs.createReadStream(audioPath)
        },
        threadID,
        messageID
      );

    } catch (e) {
      console.error("[angry] error:", e);
    }
  },

  run: async function () {}
};