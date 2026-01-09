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

      const triggers = ["😘", "😗", "😚", "😽"];

      if (!triggers.some(t => text.includes(t))) return;

      const audioPath = path.join(__dirname, "shourov", cumah.mp3");

      if (!fs.existsSync(audioPath)) {
        console.log("[angry] Audio not found:", audioPath);
        return;
      }

      api.sendMessage(
        {
          body: "লুঁচ্চাঁ পোঁলাঁপাঁইঁনঁ এঁখাঁনেঁ চুঁম্মাঁ চাঁটিঁ নাঁ কঁরেঁ পাঁটঁক্ষেঁতঁ এঁ যাঁইঁয়াঁ কঁরঁ",
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
