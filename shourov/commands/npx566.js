const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "angry",
    version: "1.0.3",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Angry emoji auto audio reply",
    category: "auto"
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = body.toLowerCase();

      const triggers = ["love", "i love you", "i love u", "valobashi", " beby", "babu"];

      if (!triggers.some(t => text.includes(t))) return;

      const audioPath = path.join(__dirname, "shourov", "amiotmkonk.mp3");

      if (!fs.existsSync(audioPath)) {
        console.log("[angry] Audio not found:", audioPath);
        return;
      }

      api.sendMessage(
        {
          body: "হুঁমঁ আঁমিঁওঁ তোঁমাঁকেঁ ভাঁলোঁবাঁসিঁ কিঁন্তুঁ লঁজ্জাঁয়ঁ বঁলঁতেঁ পাঁরিঁ নাঁ",
          attachment: fs.createReadStream(audioPath)
        },
        threadID,
        messageID
      );

    } catch (e) {
      console.error("[angry] error:", e.message);
    }
  },

  // loader এর জন্য দরকার
  run: async function () {}
};
